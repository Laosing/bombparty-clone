import React from "react";
import { useRoom } from "hooks/useRoom";
import { Avatar } from "components/Avatar";
import { User } from "types/index";

export const Lobby = () => {
	const { room } = useRoom();
	const players = room.get("users") as Map<string, User>;
	const running = room.get("running");

	const lobbyPlayers = [...players].filter(([, val]) => !val.inGame);

	if (running || lobbyPlayers.length === 0) {
		return null;
	}

	return (
		<div className="mx-auto max-w-[30rem]">
			<div className="divider"></div>
			<h5 className="text-lg font-bold mb-4 opacity-70">Players not in game</h5>
			<div className="flex flex-wrap justify-center gap-4">
				{lobbyPlayers.map(([id, val]) => (
					<div key={id} className="tooltip tooltip-bottom" data-tip={val.name}>
						<div className="w-12 h-12">
							<Avatar id={val.avatar} />
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
