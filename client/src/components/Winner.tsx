import React from "react";
import confetti from "canvas-confetti";
import { useRoom } from "hooks/useRoom";
import { Highlight } from "components/Highlight";
import { Avatar } from "components/Avatar";
import type { Group, User } from "types/index";
import clsx from "clsx";

interface WinnerProps {
	winner: Group;
}

export function Winner({ winner }: WinnerProps) {
	const { room } = useRoom();
	const users = room.get("users") as Map<string, User>;
	const round = room.get("round");
	const hardMode = room.get("hardMode");
	const roomLetterBlendWord = room.get("letterBlendWord");
	const roomLetterBlend = room.get("letterBlend");

	const ref = React.useRef<HTMLElement | null>(null);
	const refCallback = React.useCallback((node: HTMLElement | null) => {
		if (ref.current) {
			confetti.reset();
		}
		if (node) {
			const rect = node.getBoundingClientRect();
			confetti({
				disableForReducedMotion: true,
				origin: {
					x: (rect.left + rect.width / 2) / window.innerWidth,
					y: (rect.top + rect.height / 2) / window.innerHeight,
				},
				particleCount: 50,
				startVelocity: 30,
				spread: 270,
			});
		}
		ref.current = node;
	}, []);

	return (
		<div className="mt-8 animate-bounce-in text-center">
			<div className="flex flex-col items-center justify-center gap-4 mb-6">
				<h3
					ref={refCallback}
					className="text-4xl font-black flex items-center gap-3"
				>
					{`Winner${winner.members.size === 1 ? "" : "s"}! `}
					<span
						className={clsx(
							"badge badge-lg",
							hardMode ? "badge-error font-bold" : "badge-primary font-bold",
						)}
					>
						Round {round}
					</span>
				</h3>
			</div>

			<div className="flex flex-wrap justify-center items-end gap-8 mb-8">
				{[...winner.members].map((userId) => {
					const user = users.get(userId);
					if (!user) return null;
					return (
						<div key={user.id} className="flex flex-col items-center gap-4">
							<div className="w-40 h-40 animate-pulse-slow">
								<Avatar id={user.avatar} />
							</div>
							<div
								className={clsx(
									"font-black tracking-tight",
									winner.members.size === 1 ? "text-4xl" : "text-xl",
								)}
								data-testid="winner-name"
							>
								{user.name}
							</div>
						</div>
					);
				})}
			</div>

			{roomLetterBlendWord && (
				<div className="bg-base-200 p-6 rounded-3xl inline-block border border-base-300 shadow-sm mx-auto">
					<span className="opacity-50 text-xs block mb-1 uppercase tracking-widest font-bold">
						Last word
					</span>
					<span className="text-3xl font-black mb-0" data-testid="last-word">
						<Highlight
							searchWords={[roomLetterBlend?.toUpperCase()]}
							textToHighlight={roomLetterBlendWord?.toUpperCase()}
							highlightClassName="text-error"
						/>
					</span>
				</div>
			)}
		</div>
	);
}
