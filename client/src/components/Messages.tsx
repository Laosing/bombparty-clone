import { useEffect, useState, useRef } from "react";
import { deserialize } from "functions/deserialize";
import { useSocket } from "hooks/useSocket";
import type { Message } from "types/index";
import clsx from "clsx";

export function MessagesWrapper() {
	return (
		<div className="p-3 flex flex-col flex-grow min-h-0">
			<Messages />
			<MessageInput />
		</div>
	);
}

function Messages() {
	const { socket } = useSocket();
	const ref = useRef<HTMLDivElement>(null);

	const [messages, setMessages] = useState<Set<Message>>(new Set());
	const [notify, setNotify] = useState(false);

	useEffect(() => {
		const updateMessages = (val: string) => setMessages(deserialize(val));
		socket.emit("getMessages");
		socket.on("messages", updateMessages);
		return () => {
			socket.off("messages", updateMessages);
		};
	}, [socket]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Scroll on message change
	useEffect(() => {
		if (ref?.current) {
			ref.current.scrollTop = ref.current.scrollHeight;
		}
		setNotify(true);
		const timeout = setTimeout(() => {
			setNotify(false);
		}, 300);
		return () => clearTimeout(timeout);
	}, [messages]);

	return (
		<div className="overflow-y-auto flex-grow min-h-[7em]" ref={ref}>
			<div className="flex flex-col mt-auto">
				{[...messages]
					.sort((a, b) => a.time - b.time)
					.map((message, index, array) => (
						<div
							key={message.id}
							className={clsx(
								"p-2 border-b border-base-200 transition-all duration-300 rounded-lg",
								notify &&
									index === array.length - 1 &&
									"ring-1 ring-inset ring-error bg-error/5",
							)}
						>
							{message.user?.name ? (
								<div className="flex flex-col">
									<div className="flex justify-between items-baseline mb-0.5">
										<span className="font-bold text-sm">
											{message.user.name}
										</span>
										<span className="text-[0.65rem] opacity-40">
											{new Date(message.time).toLocaleTimeString()}
										</span>
									</div>
									<span className="text-sm opacity-80">{message.value}</span>
								</div>
							) : (
								<div className="flex justify-between items-baseline">
									<span className="text-sm opacity-60 italic">
										🚨 {message.value}
									</span>
									<span className="text-[0.65rem] opacity-40">
										{new Date(message.time).toLocaleTimeString()}
									</span>
								</div>
							)}
						</div>
					))}
			</div>
		</div>
	);
}

const MessageInput = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const { socket } = useSocket();

	const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const value = inputRef.current?.value.trim();
		if (value) {
			socket.emit("message", value);
		}
		(e.currentTarget as HTMLFormElement).reset();
	};

	return (
		<form onSubmit={submitForm} className="mt-2">
			<input
				ref={inputRef}
				placeholder="Type your message"
				className="input input-bordered input-sm w-full"
			/>
		</form>
	);
};
