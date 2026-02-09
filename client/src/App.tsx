import React, { Activity, Suspense } from "react";

import "./App.css";
import "animate.css";
import "react-toastify/dist/ReactToastify.css";

import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import { useGameStore } from "hooks/useStore";
import { useSingleTab } from "hooks/useSingleTab";
import { InitializeSocket } from "components/InitializeSocket";
import { ErrorBoundaryWrapper } from "components/ErrorFallback";
import { Turnstile } from "@marsidev/react-turnstile";
import { isDevEnv } from "functions/session";

const Home = React.lazy(() => import("components/Home").then((m) => ({ default: m.Home })));
const ValidateRoom = React.lazy(() => import("components/ValidateRoom").then((m) => ({ default: m.ValidateRoom })));

function App() {
	return (
		<Captcha>
			<ErrorBoundaryWrapper>
				<InitializeSocket>
					<Outlet />
				</InitializeSocket>
			</ErrorBoundaryWrapper>
		</Captcha>
	);
}

interface CaptchaProps {
	children: React.ReactNode;
}

function Captcha({ children }: CaptchaProps) {
	const ref = React.useRef(null);
	const [status, setStatus] = React.useState<"solved" | "error" | undefined>();

	const isSolved = status === "solved" || isDevEnv;
	const isError = status === "error";

	return (
		<div className="relative h-full w-full">
			<Activity mode={isSolved ? "visible" : "hidden"}>{children}</Activity>

			{!isSolved && (
				<div className="absolute inset-0 z-50 flex items-center justify-center bg-base-100">
					{isError ? (
						<div className="text-center">
							<h1 className="text-2xl font-bold">Error</h1>
							<p className="opacity-70">
								Something went wrong, please try again.
							</p>
						</div>
					) : (
						<Turnstile
							ref={ref}
							onSuccess={() => setStatus("solved")}
							onError={() => setStatus("error")}
							siteKey={
								isDevEnv
									? "1x00000000000000000000AA"
									: "0x4AAAAAABYeXvkUzwifs3U4"
							}
						/>
					)}
				</div>
			)}
		</div>
	);
}

const Router = () => {
	const theme = useGameStore((store) => store.theme);
	const blocked = useSingleTab();

	React.useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
	}, [theme]);

	if (blocked) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
				<h1 className="text-3xl font-black">Multiple tabs detected</h1>
				<p className="opacity-70 max-w-md">
					It looks like you have the game open in another tab. Please close this tab and use the other one.
				</p>
			</div>
		);
	}

	return (
		<BrowserRouter>
			<ToastContainer
				autoClose={false}
				position="top-center"
				theme={theme}
				style={{ width: "100%", maxWidth: "600px" }}
			/>
			<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><span className="loading loading-ring loading-xl text-primary"></span></div>}>
				<Routes>
					<Route path="/" element={<App />}>
						<Route index element={<Home />} />
						<Route path=":roomId" element={<ValidateRoom />}></Route>
					</Route>
				</Routes>
			</Suspense>
		</BrowserRouter>
	);
};

export default Router;
