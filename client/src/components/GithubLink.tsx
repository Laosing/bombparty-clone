import React from "react";
import { ReactComponent as GithubIcon } from "images/github.svg";

export const GithubLink = () => {
	return (
		<a
			href="https://github.com/Laosing/bombparty-clone"
			rel="noreferrer"
			target="_blank"
			className="absolute bottom-4 left-4 p-2 opacity-50 hover:opacity-100 transition-opacity z-50 tooltip tooltip-right"
			data-tip="Check it out on github!"
		>
			<GithubIcon className="w-6 h-6 fill-base-content" />
		</a>
	);
};
