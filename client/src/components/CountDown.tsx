import React, { useEffect, useState } from "react";
import soundCountDown from "audio/beep.mp3";
import soundCountDownEnd from "audio/beep-end.mp3";
import { useSocket } from "hooks/useSocket";
import { useHowl } from "hooks/useHowl";

interface CountDownProps {
	isCountDown: boolean;
}

export function CountDown({ isCountDown }: CountDownProps) {
	const { socket } = useSocket();
	const [countDown, setCountDown] = useState<number | undefined>();
	const [audioCountDown] = useHowl(soundCountDown);
	const [audioCountDownEnd] = useHowl(soundCountDownEnd);

	useEffect(() => {
		const triggerCountDown = (val: number) => {
			setCountDown(val);
			if (typeof val === "number") {
				val === 0 ? audioCountDownEnd.play() : audioCountDown.play();
			}
		};
		socket.on("startCountDown", triggerCountDown);
		return () => {
			socket.off("startCountDown", triggerCountDown);
		};
	}, [audioCountDown, audioCountDownEnd, socket]);

	if (!isCountDown || typeof countDown !== "number") {
		return null;
	}

	return (
		<div className="py-10 text-center animate-pulse">
			<div className="text-xl opacity-60 uppercase tracking-widest font-black mb-2">
				The game starts in
			</div>
			<div className="text-9xl font-black text-primary drop-shadow-xl select-none">
				{countDown}
			</div>
		</div>
	);
}
