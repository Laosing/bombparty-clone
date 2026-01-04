import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { LayoutWithHeader } from "components/Layout";
import { reset } from "functions/reset";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<LayoutWithHeader className="pb-10 flex flex-col items-center gap-6">
			<div className="alert alert-error shadow-lg max-w-lg">
				<div className="flex flex-col items-start gap-2">
					<h3 className="font-bold text-lg text-error-content">
						Oops, something went wrong 😔
					</h3>
					{error.message && (
						<span className="text-sm opacity-90 text-error-content">
							Error: {error.message}
						</span>
					)}
				</div>
			</div>
			<button
				className="btn btn-primary btn-lg px-10"
				onClick={resetErrorBoundary}
				type="button"
			>
				Click here to try again
			</button>
		</LayoutWithHeader>
	);
}

interface ErrorBoundaryWrapperProps {
	children: React.ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback} onReset={reset}>
			{children}
		</ErrorBoundary>
	);
}
