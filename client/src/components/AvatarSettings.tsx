import React from "react";
import { Avatar } from "components/Avatar";
import { useRoom } from "hooks/useRoom";
import { useSocket } from "hooks/useSocket";
import { useGameStore } from "hooks/useStore";
import { nanoid } from "nanoid";
import { User } from "types/index";

export function AvatarSettings() {
	const { socket, userId } = useSocket();
	const { room } = useRoom();
	const setAvatarSeed = useGameStore((state) => state.setAvatarSeed);

	const users = room.get("users") as Map<string, User>;
	const currentGroup = users.get(userId || "");

	const editAvatar = () => {
		const newSeed = nanoid();
		setAvatarSeed(newSeed);
		socket.emit("updateAvatar", userId, newSeed);
	};

	if (!currentGroup) return null;

	return (
		<div className="flex justify-center items-center">
			<div className="relative">
				<div className="w-20 h-20">
					<Avatar id={currentGroup.avatar} />
				</div>
				<button
					className="btn btn-ghost btn-xs btn-circle absolute -bottom-1 -right-1 bg-base-100 border shadow-sm hover:scale-110"
					onClick={editAvatar}
					title="Change avatar"
					type="button"
				>
					✒️
				</button>
			</div>
		</div>
	);
}
