import { useEffect, useState } from "react";
import io, { type Socket } from "socket.io-client";
import { deserialize } from "functions/deserialize";
import { log, isDevEnv } from "functions/session";
import { useGameStore } from "hooks/useStore";
import { SocketContext } from "hooks/useSocket";
import { LayoutWithHeader } from "components/Layout";

interface InitializeSocketProps {
	children: React.ReactNode;
}

export const InitializeSocket = ({ children }: InitializeSocketProps) => {
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const userId = useGameStore((state) => state.userId);

	// biome-ignore lint/correctness/useExhaustiveDependencies: socket is intentionally omitted to avoid closed connection on re-render
	useEffect(() => {
		if (!socket) {
			const logger = (event: string, ...args: any[]) => {
				log(
					"%c" + event,
					"color: pink;",
					event === "getRoom" ? deserialize(args[0]) : args,
				);
			};

			const params = {
				auth: { userId },
				upgrade: false,
				transports: ["websocket"],
			};
			const props = isDevEnv
				? ([`http://${window.location.hostname}:8080`, params] as const)
				: ([params] as const);

			// @ts-ignore - io spread arguments issue
			const newSocket = io(...(props as any));
			setSocket(newSocket);
			log("setting socket!", newSocket);

			newSocket.onAny(logger);
			return () => {
				log("closing!");
				newSocket.offAny(logger);
				newSocket.close();
			};
		}
	}, [userId]);

	if (!socket) {
		return (
			<LayoutWithHeader className="flex flex-col items-center justify-center min-h-screen gap-4">
				<h1 className="text-3xl font-black">Not Connected</h1>
				<p className="opacity-60">Try refreshing the page</p>
			</LayoutWithHeader>
		);
	}

	return (
		<SocketContext.Provider value={{ socket, userId }}>
			{children}
		</SocketContext.Provider>
	);
};
