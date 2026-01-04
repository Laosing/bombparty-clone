import { useEffect } from "react";
import clsx from "clsx";
import soundBoom from "audio/boom.mp3";
import soundValid from "audio/valid.mp3";
import soundInvalid from "audio/error.mp3";
import soundJoining from "audio/joining.mp3";
import soundLeaving from "audio/leaving.mp3";
import soundGainedHeart from "audio/gained-heart.wav";
import soundGainedBonusLetter from "audio/bonus-letter.mp3";
import soundWinner from "audio/winner.mp3";
import { useGameStore } from "hooks/useStore";
import { useSocket } from "hooks/useSocket";
import { useRoom } from "hooks/useRoom";
import { useWordValidation } from "hooks/useEventTimeout";
import { useHowl } from "hooks/useHowl";
import { LETTER_BONUS } from "constants/constants";
import { Highlight } from "components/Highlight";
import { Avatar } from "components/Avatar";
import { Rounds } from "components/Rounds";
import type { Group, User } from "types/index";

export function Players() {
	const { socket, userId } = useSocket();
	const { room } = useRoom();
	const players = room.get("users") as Map<string, User>;
	const user = players.get(userId || "");
	const groups = room.get("groups") as Map<string, Group>;
	const running = room.get("running");
	const currentGroup = room.get("currentGroup");
	const isCountDown = room.get("isCountDown");

	const isAdmin = useGameStore((state) => state.isAdmin);

	const [validControls] = useHowl(soundValid);
	const [invalidControls] = useHowl(soundInvalid);
	const [boomControls] = useHowl(soundBoom);
	const [winnerControls] = useHowl(soundWinner);
	const [userJoinedControls] = useHowl(soundJoining);
	const [userLeftControls] = useHowl(soundLeaving);
	const [gainedHeartControls] = useHowl(soundGainedHeart);
	const [gainedBonusLetter] = useHowl(soundGainedBonusLetter);

	const validation = useWordValidation(500, (isValid) => {
		if (isValid) {
			validControls.play();
		} else {
			invalidControls.play();
		}
	});

	useEffect(() => {
		const triggerGainedBonusLetter = () => gainedBonusLetter.play();
		const triggerGainedHeart = () => gainedHeartControls.play();
		const triggerBoom = () => boomControls.play();
		const triggerUserJoined = () => userJoinedControls.play();
		const userLeft = () => userLeftControls.play();
		const triggerWinner = () => winnerControls.play();

		socket.on("bonusLetter", triggerGainedBonusLetter);
		socket.on("gainedHeart", triggerGainedHeart);
		socket.on("userJoined", triggerUserJoined);
		socket.on("userLeft", userLeft);
		socket.on("winner", triggerWinner);
		socket.on("boom", triggerBoom);
		return () => {
			socket.off("bonusLetter", triggerGainedBonusLetter);
			socket.off("gainedHeart", triggerGainedHeart);
			socket.off("userJoined", triggerUserJoined);
			socket.off("userLeft", userLeft);
			socket.off("winner", triggerWinner);
			socket.off("boom", triggerBoom);
		};
	}, [
		socket,
		gainedBonusLetter,
		gainedHeartControls,
		boomControls,
		userJoinedControls,
		userLeftControls,
		winnerControls,
	]);

	const textColor =
		validation.isValid === false
			? "text-error"
			: validation.isValid
				? "text-success"
				: "";

	const kickPlayer = (kickedUserId: string) =>
		socket.emit("kickPlayer", kickedUserId, userId);
	const highestScore = Math.max(...[...groups].map(([, val]) => val.score));

	const joinGroup = (groupId?: string) =>
		socket.emit("joinGroup", groupId, userId);

	const isInGroup = (groupId: string) => user?.group !== groupId;

	return (
		<div>
			{!running && <h5 className="text-xl font-bold mb-4">Players</h5>}
			<div className="m-auto relative px-4 max-w-[30rem]">
				<Rounds />

				{Array.from(groups, ([groupId, group]) => {
					return (
						<div key={groupId} className="flex flex-col gap-1 mb-4">
							{[...group.members].map((memberId, index) => {
								const isActiveTyper =
									group.activeTyper % group.members.size === index;
								const member = players.get(memberId);
								if (!member) return null; // handle case where member not found
								const onlyRowOne = index === 0;
								return (
									<div
										key={memberId}
										className={clsx(
											"relative flex items-center gap-3 p-3 border rounded-xl bg-base-100 shadow-sm transition-all",
											running &&
												group.lives <= 0 &&
												"bg-base-300 opacity-60 line-through",
											groupId === currentGroup &&
												"border-primary bg-primary/5 shadow-md",
											groupId === currentGroup &&
												isActiveTyper &&
												running &&
												"activeTyper",
										)}
									>
										<span className="absolute left-0 -translate-x-full pr-4 w-10 flex flex-col items-center">
											<div className="relative">
												{!running && <Avatar id={member.avatar} />}
												{running &&
													(group.lives > 0 ? (
														<Avatar id={member.avatar} />
													) : (
														"💀"
													))}
												{onlyRowOne && (
													<span
														className={clsx(
															"badge badge-xs absolute -top-1 -right-1 z-10",
															highestScore > 0 && group.score === highestScore
																? "badge-primary"
																: "badge-ghost",
														)}
													>
														{group.score}
													</span>
												)}
											</div>
										</span>

										{isAdmin && (
											<button
												className="btn btn-ghost btn-xs absolute right-0 translate-x-full pl-2 hover:bg-transparent"
												onClick={() => kickPlayer(member.id)}
												type="button"
											>
												🥾
											</button>
										)}

										<div className="flex-1 flex items-center justify-between min-w-0">
											<span
												className={clsx(
													"truncate",
													groupId === currentGroup && "font-bold",
													groupId === validation.currentGroup && textColor,
												)}
											>
												{groupId === currentGroup && onlyRowOne && (
													<span className="inline-block animate-bounce mr-1">
														💣
													</span>
												)}
												{member.name}
												{isActiveTyper && running && " ✏️"}
											</span>

											<div className="flex items-center gap-2">
												{running && onlyRowOne && (
													<div className="flex text-error text-[0.7rem] tracking-tighter">
														{Array.from(
															Array(Number(group?.lives) || 0),
															(_, i) => (
																<span key={`heart-${i}-${memberId}`}>❤</span>
															),
														)}
													</div>
												)}

												{running && groupId !== currentGroup && onlyRowOne && (
													<>
														<span className="text-xs opacity-60 ml-2">
															<Highlight
																searchWords={[group.letterBlend || ""]}
																textToHighlight={group.text}
																highlightClassName="font-bold text-error"
															/>
														</span>
														{Boolean(group.text.length) && (
															<span
																className={clsx(
																	"badge badge-xs",
																	group.text.length > LETTER_BONUS
																		? "badge-warning"
																		: "badge-ghost",
																)}
															>
																{group.text.length}
															</span>
														)}
													</>
												)}

												{isInGroup(groupId) &&
													!isCountDown &&
													!running &&
													onlyRowOne &&
													user?.inGame && (
														<button
															className="btn btn-primary btn-xs"
															onClick={() => joinGroup(groupId)}
															type="button"
														>
															Join Team
														</button>
													)}

												{!isInGroup(groupId) &&
													!isCountDown &&
													group.members.size > 1 &&
													!running &&
													onlyRowOne &&
													user?.inGame && (
														<button
															className="btn btn-ghost btn-xs"
															onClick={() => joinGroup()}
															type="button"
														>
															Leave team
														</button>
													)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
}
