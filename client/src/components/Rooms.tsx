import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { deserialize } from "functions/deserialize";
import { useGameStore } from "hooks/useStore";
import { useSocket } from "hooks/useSocket";

interface RoomData {
	isPrivate: boolean;
	players: { size: number }; // Simplified view of players for list
	// Add other properties if needed based on what backend sends
}

export const Rooms = () => {
	const { socket } = useSocket();
	const [rooms, setRooms] = useState<Map<string, RoomData>>(new Map());
	const userId = useGameStore((state) => state.userId);

	useEffect(() => {
		const getRooms = (val: string) => setRooms(new Map(deserialize(val)));

		socket.emit("leaveRoom", userId);
		socket.emit("getRooms");
		socket.on("getRooms", getRooms);
		return () => {
			socket.off("getRooms", getRooms);
		};
	}, [socket, userId]);

	const gameRooms = useMemo(() => [...rooms].filter(([, data]) => !data.isPrivate), [rooms]);

	return (
		<div className="w-full">
			<div className="flex flex-wrap justify-center gap-4">
				{gameRooms.map(([room, data]) => (
					<Link
						key={room}
						to={room}
						className="btn btn-secondary btn-outline font-bold shadow-sm"
					>
						{room}
						<span className="badge badge-neutral ml-2">
							{data.players.size}
						</span>
					</Link>
				))}
				{gameRooms.length === 0 && (
					<p className="text-sm opacity-50 italic">No active public rooms</p>
				)}
			</div>
		</div>
	);
};
