import React from "react";
import { getRandomName } from "functions/session";
import { useGameStore } from "hooks/useStore";
import { useSocket } from "hooks/useSocket";

export function EditName() {
	const { socket } = useSocket();

	const name = useGameStore((state) => state.name);
	const setName = useGameStore((state) => state.setName);
	const userId = useGameStore((state) => state.userId);

	const editName = () => {
		const namePrompt = window.prompt(
			"Name: (over 30 characters or blank will generate a random name)",
		);
		if (namePrompt !== null) {
			const validName = namePrompt.trim().length < 30 && namePrompt.trim();
			const newName = validName ? namePrompt.trim() : getRandomName();
			setName(newName);
			socket.emit("updateName", newName, userId);
		}
	};

	return (
		<div className="text-xl font-bold flex justify-center items-center">
			<div className="relative group">
				{name}
				<button
					className="btn btn-ghost btn-xs btn-circle ml-2"
					onClick={editName}
					title="Edit name"
					type="button"
				>
					✏️
				</button>
			</div>
		</div>
	);
}
