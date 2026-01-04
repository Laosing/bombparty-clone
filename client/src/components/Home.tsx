import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRoomId } from "functions/session";
import { LayoutWithHeader } from "components/Layout";
import { Rooms } from "components/Rooms";

export const Home = () => {
	const navigate = useNavigate();
	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const room = (formData.get("room") as string).toUpperCase();
		navigate(room);
	};

	const [isPrivate, setIsPrivate] = useState(false);
	const toggle = () => setIsPrivate((p) => !p);

	return (
		<LayoutWithHeader className="pb-10">
			<h1 className="text-5xl font-extrabold mb-4">Welcome to 💣party!</h1>
			<p className="text-xl mb-10 opacity-70">
				Create or join a room to get started
			</p>

			<div className="flex flex-col items-center gap-4">
				<Link
					to={getRoomId()}
					state={{ isPrivate }}
					className="btn btn-primary btn-lg mb-1"
				>
					Create room
				</Link>

				<div className="form-control">
					<label className="label cursor-pointer gap-2">
						<input
							type="checkbox"
							id="private-room"
							checked={isPrivate}
							onChange={toggle}
							className="checkbox checkbox-primary"
						/>
						<span className="label-text">Private room</span>
					</label>
				</div>

				<form onSubmit={onSubmit} className="mt-8 mb-10 w-full max-w-sm">
					<label
						className="label flex flex-col items-center"
						htmlFor="existing-room"
					>
						<span className="label-text mb-2">
							Know an existing room? Enter it here!
						</span>
					</label>
					<div className="join w-full justify-center">
						<input
							id="existing-room"
							className="input input-bordered join-item uppercase w-32"
							name="room"
							autoComplete="off"
						/>
						<button type="submit" className="btn btn-outline join-item">
							Join
						</button>
					</div>
				</form>
			</div>

			<div className="divider my-10 text-base-content/30">PUBLIC ROOMS</div>

			<Rooms />
		</LayoutWithHeader>
	);
};
