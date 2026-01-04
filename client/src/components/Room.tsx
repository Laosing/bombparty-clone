import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useGameStore } from "hooks/useStore";
import { useSocket } from "hooks/useSocket";
import { useRoom } from "hooks/useRoom";
import { useIdle } from "hooks/useIdle";
import { MessagesWrapper } from "components/Messages";
import { PrivateTooltip } from "components/PrivateTooltip";
import { Hr } from "components/Hr";
import { Game } from "components/Game";
import { EditName } from "components/EditName";
import { AvatarSettings } from "components/AvatarSettings";
import { AudioSettings } from "components/AudioSettings";
import { GameSettings } from "components/GameSettings";
import { GithubLink } from "components/GithubLink";
import { reset } from "functions/reset";

export function Room() {
	const { socket } = useSocket();
	const { roomId, room } = useRoom() as any;
	const theme = useGameStore((state) => state.theme);
	const isPrivate = room.get("private");
	const isAdmin = useGameStore((state) => state.isAdmin);

	const resetClient = () => socket.emit("resetClient");

	useEffect(() => {
		socket.on("resetClient", reset);
		return () => {
			socket.off("resetClient", reset);
		};
	}, [socket]);

	useIdle();

	return (
		<div
			className={clsx(
				"flex flex-col lg:flex-row min-h-screen lg:h-screen lg:overflow-hidden bg-base-100",
				theme,
			)}
		>
			{isAdmin && (
				<button
					type="button"
					onClick={resetClient}
					className="btn btn-ghost btn-circle btn-sm absolute top-2 right-4 lg:right-auto lg:left-4 z-50 text-xl"
					title="Reset client"
				>
					☠️
				</button>
			)}

			{/* Main Game Area */}
			<main className="flex-1 relative flex flex-col min-h-0 lg:overflow-y-auto">
				<GithubLink />
				<div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[300px] lg:min-h-0">
					<Game />
				</div>
			</main>

			{/* Sidebar Area */}
			<aside className="w-full lg:w-96 flex flex-col bg-base-200 border-l border-base-300 lg:overflow-y-auto shrink-0">
				<div className="p-6 pb-2">
					<AvatarSettings />
					<EditName />
				</div>

				<div className="px-6 py-4">
					<div className="flex justify-between items-center bg-base-100 p-3 rounded-xl border border-base-300 shadow-sm mb-4">
						<span className="text-sm font-medium">
							Room: <strong className="font-mono text-primary">{roomId}</strong>{" "}
							{isPrivate && <PrivateTooltip />}
						</span>
						<Link to="/" className="btn btn-error btn-xs rounded-lg">
							Leave room
						</Link>
					</div>
				</div>

				<div className="flex flex-col flex-grow">
					<div className="divider px-6 my-1 text-[0.65rem] opacity-30 tracking-widest uppercase">
						Audio
					</div>
					<AudioSettings />

					<div className="divider px-6 my-1 text-[0.65rem] opacity-30 tracking-widest uppercase">
						Game Settings
					</div>
					<GameSettings />

					<div className="divider px-6 my-1 text-[0.65rem] opacity-30 tracking-widest uppercase">
						Chat
					</div>
					<MessagesWrapper />
				</div>
			</aside>
		</div>
	);
}
