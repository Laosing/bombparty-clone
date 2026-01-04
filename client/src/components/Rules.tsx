import React from "react";
import clsx from "clsx";
import { useGameStore } from "hooks/useStore";

interface RulesProps {
	className?: string;
}

export const Rules = ({ className }: RulesProps) => {
	const setIsAdmin = useGameStore((state) => state.setIsAdmin);
	const toggleAdmin = () => setIsAdmin();
	const theme = useGameStore((store) => store.theme);

	return (
		<div
			className={clsx(
				"alert mx-auto max-w-[30rem] shadow-lg mb-6",
				theme === "light" ? "alert-info" : "alert-warning",
				className,
			)}
		>
			<div className="flex flex-col items-center">
				<h5 className="font-bold text-lg mb-2 text-center">Rules 🧐</h5>
				<div className="text-sm space-y-3 opacity-90 text-center">
					<p>
						On a player's turn they must type a word (3 letters or more)
						containing the given letters in the <strong>same order</strong>{" "}
						before the bomb explodes{" "}
						<span className="cursor-pointer" onClick={toggleAdmin}>
							🤯
						</span>{" "}
						(example: LU - BLUE).
					</p>
					<p>
						If a player does not type a word in time, they lose a heart 💀. The
						last player remaining wins the game 🎉.
					</p>
					<p className="mb-0">
						The alphabet is at the top, use all the letters to gain a heart ❤️.
						Bonus for long words: word ≥ 11 letters gives a free random letter
						🤓.
					</p>
				</div>
			</div>
		</div>
	);
};
