import React from "react";
import clsx from "clsx";
import { useRoom } from "hooks/useRoom";

export function Rounds() {
	const { room } = useRoom();
	const round = room.get("round");
	const running = room.get("running");
	const hardMode = room.get("hardMode");

	if (!running) {
		return null;
	}

	return (
		<div
			className={clsx(
				"absolute -top-10 left-0 p-2 font-bold uppercase tracking-widest text-sm opacity-60",
				hardMode ? "text-error" : "text-primary",
			)}
		>
			Round <span className="text-lg font-black">{round}</span>
		</div>
	);
}
