import { useEffect, useState } from "react";

const CHANNEL_NAME = "bombparty-tab-guard";

export function useSingleTab() {
	const [blocked, setBlocked] = useState(false);

	useEffect(() => {
		const channel = new BroadcastChannel(CHANNEL_NAME);

		// Ask if any tab is already active
		channel.postMessage("ping");

		channel.onmessage = (e) => {
			if (e.data === "ping") {
				// Another tab is asking — reply to tell it we exist
				channel.postMessage("pong");
			} else if (e.data === "pong") {
				// An existing tab responded — this tab is the duplicate
				setBlocked(true);
			}
		};

		return () => {
			channel.close();
		};
	}, []);

	return blocked;
}
