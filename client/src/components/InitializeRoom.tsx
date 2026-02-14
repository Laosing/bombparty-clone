import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { deserialize } from "functions/deserialize";
import { useInterval } from "hooks/useInterval";
import { useGameStore } from "hooks/useStore";
import { useSocket } from "hooks/useSocket";
import { RoomContext } from "hooks/useRoom";
import { LayoutWithHeader } from "components/Layout";
import { Room as RoomComponent } from "components/Room";

export function InitializeRoom() {
	const { socket } = useSocket();
	const userId = useGameStore((state) => state.userId);

	const { roomId } = useParams<{ roomId: string }>();
	const [room, setRoom] = useState<Map<string, any> | undefined>();

	const nameRef = useRef(useGameStore.getState().name);
	const avatarSeedRef = useRef(useGameStore.getState().avatarSeed);

	const location = useLocation();
	const isPrivate = (location.state as { isPrivate?: boolean } | null)
		?.isPrivate;

	useEffect(() => {
		const getRoom = (val: string) => setRoom(deserialize(val));
		const patchRoom = (val: string) => {
			const patch = deserialize<Map<string, any>>(val);
			setRoom((prev) => {
				if (!prev) return prev;
				const next = new Map(prev);
				for (const [key, value] of patch) {
					next.set(key, value);
				}
				return next;
			});
		};

		socket.emit("joinRoom", { roomId, isPrivate, name: nameRef.current, avatarSeed: avatarSeedRef.current });
		socket.on("getRoom", getRoom);
		socket.on("roomPatch", patchRoom);
		return () => {
			socket.off("getRoom", getRoom);
			socket.off("roomPatch", patchRoom);
		};
	}, [socket, roomId, isPrivate]);

	const MAX_RETRIES = 3;
	const retryCount = useRef(0);
	const isLoadingStuck = !room || !room.get("users")?.has(userId);
	useInterval(
		() => {
			if (isLoadingStuck && retryCount.current < MAX_RETRIES) {
				retryCount.current += 1;
				window.location.reload();
			}
		},
		isLoadingStuck ? 5000 * (retryCount.current + 1) : null,
	);

	if (!room) {
		return (
			<LayoutWithHeader className="flex flex-col items-center justify-center gap-6 min-h-[60vh]">
				<h1 className="text-3xl font-black text-center">Initializing room</h1>
				<span className="loading loading-ring loading-xl text-primary"></span>
			</LayoutWithHeader>
		);
	}

	if (!room.get("users")?.has(userId)) {
		return (
			<LayoutWithHeader className="flex flex-col items-center justify-center gap-6 min-h-[60vh] text-center">
				<h1 className="text-3xl font-black">Disconnected!</h1>
				<span className="loading loading-ring loading-xl text-primary"></span>
				<p className="max-w-md opacity-70">
					Hold on! We're trying to get you back on track. If this page is stuck
					try{" "}
					<Link to="/" className="link link-primary">
						rejoining a different room
					</Link>
				</p>
			</LayoutWithHeader>
		);
	}

	return (
		<RoomContext.Provider value={{ room, roomId: roomId as string }}>
			<RoomComponent />
		</RoomContext.Provider>
	);
}
