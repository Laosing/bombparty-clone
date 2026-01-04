import React from "react";

interface MusicLabelProps {
	toggleMusicVersion: () => void;
}

export const MusicLabel = ({ toggleMusicVersion }: MusicLabelProps) => (
	<button
		onClick={toggleMusicVersion}
		type="button"
		className="badge badge-secondary badge-outline cursor-pointer hover:bg-secondary hover:text-secondary-content text-[0.65em] border py-2"
	>
		Change song
	</button>
);
