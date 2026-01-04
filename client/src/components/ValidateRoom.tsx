import React from "react";
import { Link, useParams } from "react-router-dom";
import { LayoutWithHeader } from "components/Layout";
import { InitializeRoom } from "components/InitializeRoom";

export function ValidateRoom() {
	const { roomId } = useParams<{ roomId: string }>();
	const validRoomId = roomId && roomId.match(/^[A-Z]*$/) && roomId.length === 4;

	if (!validRoomId) {
		return (
			<LayoutWithHeader>
				<h1 className="text-3xl font-black mb-6">Invalid room</h1>
				<Link to="/" className="btn btn-primary px-8">
					Back to home
				</Link>
			</LayoutWithHeader>
		);
	}

	return <InitializeRoom />;
}
