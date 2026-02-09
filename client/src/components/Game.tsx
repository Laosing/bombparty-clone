import React, { useEffect } from "react";
import clsx from "clsx";
import soundLobby from "audio/lobby.m4a";
import soundLobby2 from "audio/lobby-2.m4a";
import { ReactComponent as Bombsvg } from "images/bomb.svg";
import { log } from "functions/session";
import { useGameStore, useSoundStore } from "hooks/useStore";
import { useRoom } from "hooks/useRoom";
import { useHowl } from "hooks/useHowl";
import { useSocket } from "hooks/useSocket";
import { Highlight } from "components/Highlight";
import { Rules } from "components/Rules";
import { HeartLetters } from "components/HeartLetters";
import { CountDown } from "components/CountDown";
import { useEventTimeout } from "hooks/useEventTimeout";
import { useBoomTimeout } from "hooks/useBoomTimeout";
import { PlayerInput } from "components/PlayerInput";
import { Players } from "components/Players";
import { Winner } from "components/Winner";
import { Lobby } from "components/Lobby";
import { Group, User } from "types/index";

export function Game() {
	const { socket, userId } = useSocket();
	const { room } = useRoom();
	const musicVersion = useSoundStore((store) => store.musicVersion);
	const musicEnabled = useSoundStore((store) => store.music);
	const name = useGameStore((state) => state.name);
	const theme = useGameStore((state) => state.theme);

	const letterBlend = room.get("letterBlend");
	const timer = room.get("timer");
	const running = room.get("running");
	const winner = room.get("winner");
	const hardMode = room.get("hardMode");
	const users = room.get("users") as Map<string, User>;
	const groups = room.get("groups") as Map<string, Group>;
	const isCountDown = room.get("isCountDown");

	const hasPlayers = Array.from(groups).filter(
		([, group]) => group.members.size,
	).length;
	// @ts-ignore - users is a Map, but get(userId) might be undefined.
	const isInGame = users.get(userId || "")?.inGame && hasPlayers;

	const [lobbyMusic] = useHowl(
		musicVersion === 0 ? soundLobby2 : soundLobby,
		"music",
		{
			loop: true,
			autoplay: true,
		},
	);

	const [boom] = useEventTimeout("boom", false);
	const [[boomLetterBlend, boomWord], resetBoom] =
		useBoomTimeout<string>("boomWord");

	const toggleGame = () => {
		if (running) {
			log("STOP!");
			socket.emit("stopGame", null, userId);
		} else {
			log("START!");
			socket.emit("startGame", userId);
		}
	};

	const joinGame = () => socket.emit("joinGame", userId, name);
	const leaveGame = () => socket.emit("leaveGame", userId);
	const startGameNoCounter = () => socket.emit("startGameNoCounter", userId);

	useEffect(() => {
		if (running || isCountDown) {
			lobbyMusic.stop();
		} else {
			resetBoom();
			if (musicEnabled) {
				const sound = lobbyMusic.play();
				lobbyMusic.fade(0, 1, 2000, sound);
			}
		}
	}, [running, lobbyMusic, resetBoom, isCountDown, musicEnabled]);

	return (
		<div className="w-full max-w-2xl mx-auto flex flex-col items-center">
			<div className="flex flex-wrap justify-center gap-4 mb-8">
				{!running && !isCountDown && (
					<>
						{isInGame ? (
							<button
								className="btn btn-error btn-sm lg:btn-md"
								onClick={() => leaveGame()}
								type="button"
							>
								Leave game
							</button>
						) : (
							<button
								className="btn btn-primary btn-sm lg:btn-md px-8"
								onClick={() => joinGame()}
								type="button"
							>
								Join game
							</button>
						)}
					</>
				)}
				{isInGame && !isCountDown && (
					<button
						className={clsx(
							"btn btn-sm lg:btn-md px-8",
							running ? "btn-error btn-outline" : "btn-primary",
						)}
						onClick={toggleGame}
						type="button"
					>
						{running ? "Stop" : "Start Game"}
					</button>
				)}
				{isInGame && isCountDown && (
					<button
						className="btn btn-neutral btn-sm lg:btn-md"
						onClick={startGameNoCounter}
						type="button"
					>
						Start Now
					</button>
				)}
			</div>

			{!running && !winner && !isCountDown && <Rules />}
			<CountDown isCountDown={isCountDown} />
			{running && isInGame && <HeartLetters />}

			{running && (
				<div className="my-8 relative w-full flex flex-col items-center">
					{boomWord && (
						<div className="absolute -top-6 w-full text-center text-xs opacity-60 tracking-widest font-bold uppercase transition-all animate-pulse">
							<Highlight
								searchWords={[boomLetterBlend?.toUpperCase()]}
								textToHighlight={boomWord?.toUpperCase()}
								highlightClassName={
									theme === "light" ? "text-error" : "text-warning"
								}
							/>
						</div>
					)}

					<div className="text-7xl font-black mb-6 tracking-tighter">
						{letterBlend?.toUpperCase()}
					</div>

					<PlayerInput />

					<div className="relative flex items-center justify-center w-24 h-24 mt-6">
						<div
							className="absolute text-white z-20 font-black text-3xl"
							style={{
								transform: `translate(${String(timer).length > 1 ? "-15%" : "-25%"}, 15%)`,
							}}
						>
							{timer}
						</div>
						<div className={clsx(boom && "boom", "w-full h-full relative")}>
							<Bombsvg
								className={clsx(
									"animate-pulse w-full h-full",
									boom && "scale-110",
								)}
								style={{
									fill: hardMode ? "oklch(var(--er))" : "currentColor",
								}}
							/>
						</div>
					</div>
				</div>
			)}

			{!running && winner && !isCountDown && <Winner winner={winner} />}

			<div className="w-full mt-10">
				<Players />
				<Lobby />
			</div>
		</div>
	);
}
