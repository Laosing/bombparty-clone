import { useEffect, useState, useDeferredValue, useRef, useCallback } from "react";
import clsx from "clsx";
import { LETTER_BONUS } from "constants/constants";
import { useSocket } from "hooks/useSocket";
import { useRoom } from "hooks/useRoom";
import { useWordValidation, useEventTimeout } from "hooks/useEventTimeout";
import type { Group } from "types/index";

export function PlayerInput() {
	const { socket, userId } = useSocket();
	const { room } = useRoom();

	const [value, setValue] = useState("");
	const deferredValue = useDeferredValue(value);

	const validation = useWordValidation(500);

	const [bonusLetter] = useEventTimeout<string>("bonusLetter", "", 1000);

	const currentGroup = room.get("currentGroup");
	const groups = room.get("groups");

	const group = groups.get(currentGroup) as Group | undefined;
	const isCurrentGroup = group?.members?.has?.(userId || "");
	const index = [...(group?.members || [])].findIndex((id) => id === userId);
	const isActiveTyper =
		group && group.activeTyper % group.members.size === index;

	const submitForm = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		socket.emit("checkWord", value, currentGroup);
		e.currentTarget.reset();
	};

	const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const emitText = useCallback((val: string) => {
		clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			socket.emit("setGlobalInputText", val);
		}, 50);
	}, [socket]);

	useEffect(() => {
		return () => clearTimeout(debounceRef.current);
	}, []);

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value.toLowerCase();
		setValue(val);
		emitText(val);
	};

	const color =
		validation.isValid === false
			? "input-error animate-shake"
			: validation.isValid
				? "input-success"
				: "";

	const errorReason =
		validation.isUnique === false
			? "Already used!"
			: validation.isDictionary === false
				? "Not in my dictionary!"
				: validation.isBlend === false
					? "Missing the letters above"
					: "";

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset input when player changes
	useEffect(() => {
		setValue("");
		socket.emit("setGlobalInputText", "");
	}, [currentGroup, isActiveTyper, socket]);

	useEffect(() => {
		const setGlobalInputText = (val: string) => setValue(val);
		socket.on("setGlobalInputText", setGlobalInputText);
		return () => {
			socket.off("setGlobalInputText", setGlobalInputText);
		};
	}, [socket]);

	const inputProps = {
		disabled: !isCurrentGroup || !isActiveTyper,
		...((!isCurrentGroup || !isActiveTyper) && { value: deferredValue }),
		...(isCurrentGroup && isActiveTyper && { onChange: onChange }),
	};

	return (
		<form
			onSubmit={submitForm}
			className="relative flex flex-col items-center w-full max-w-[20rem] mx-auto mt-1 mb-2"
		>
			<input
				className={clsx(
					"input input-bordered w-full text-center text-2xl font-bold uppercase",
					color,
				)}
				key={`${currentGroup}_${isActiveTyper}`}
				// biome-ignore lint/a11y/noAutofocus: Game input needs focus
				autoFocus
				{...inputProps}
				type="text"
				maxLength={40}
			/>
			{deferredValue && (
				<span
					className={clsx(
						"badge absolute right-3 top-1/2 -translate-y-1/2 font-bold",
						deferredValue.length > LETTER_BONUS
							? "badge-warning"
							: "badge-ghost opacity-60",
					)}
				>
					{deferredValue.length}
				</span>
			)}
			{bonusLetter && (
				<span className="badge badge-warning absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 text-lg py-3 px-4 shadow-md font-bold">
					{bonusLetter.toUpperCase()}
				</span>
			)}
			{errorReason && !bonusLetter && (
				<span className="badge badge-error absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 text-sm py-2 px-4 shadow-md font-bold whitespace-nowrap">
					{errorReason}
				</span>
			)}
		</form>
	);
}
