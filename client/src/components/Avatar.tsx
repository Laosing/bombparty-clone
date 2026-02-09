import React from "react";
import { createAvatar } from "@dicebear/core";
import { bigSmile } from "@dicebear/collection";

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	id: string;
}

export const Avatar = ({ id, ...props }: AvatarProps) => {
	const avatarUrl = React.useMemo(() => {
		const avatar = createAvatar(bigSmile, { seed: id });
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatar.toString())}`;
	}, [id]);

	return (
		<img
			src={avatarUrl}
			alt=""
			className="w-full h-full"
			{...props}
		/>
	);
};
