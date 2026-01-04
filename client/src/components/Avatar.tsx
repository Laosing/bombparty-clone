import React from "react";
import { createAvatar } from "@dicebear/core";
import { bigSmile } from "@dicebear/collection";

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	id: string;
}

export const Avatar = ({ id, ...props }: AvatarProps) => {
	const avatar = React.useMemo(
		() => createAvatar(bigSmile, { seed: id }),
		[id],
	);

	return (
		<img
			src={`data:image/svg+xml;utf8,${encodeURIComponent(avatar.toString())}`}
			alt=""
			className="w-full h-full"
			{...props}
		/>
	);
};
