import { useSocket } from "hooks/useSocket";
import { useRoom } from "hooks/useRoom";
import type { Group, User } from "types/index";
import clsx from "clsx";

export function HeartLetters() {
	const { userId } = useSocket();
	const { room } = useRoom();

	const running = room.get("running");
	const groups = room.get("groups") as Map<string, Group>;
	const users = room.get("users") as Map<string, User>;

	const user = users.get(userId || "");
	const groupId = user?.group;
	const group = groups.get(groupId || "");
	const userLetters = [...(group?.letters || [])];
	const userBonusLetters = [...(group?.bonusLetters || [])];
	const alphabet = "abcdefghijklmnopqrstuvwxyz";

	if (!running) {
		return null;
	}

	return (
		<div className="flex flex-wrap justify-center gap-1 max-w-[480px] mx-auto py-2">
			{[...alphabet].map((letter) => (
				<span
					key={letter}
					className={clsx(
						"badge badge-sm w-8 h-8 font-mono font-bold border-2 transition-all",
						userBonusLetters.includes(letter)
							? "badge-warning border-warning scale-110 shadow-sm"
							: userLetters.includes(letter)
								? "badge-neutral border-neutral"
								: "badge-ghost opacity-20",
					)}
				>
					{letter.toUpperCase()}
				</span>
			))}
		</div>
	);
}
