import React from "react";

export const HardmodeTooltip = () => {
	return (
		<div className="tooltip tooltip-top">
			<div className="tooltip-content w-48">
				Randomizes the bomb timer (subtracts a random number between 0 -
				timer/2)
			</div>
			<span className="cursor-help opacity-70">ℹ️</span>
		</div>
	);
};
