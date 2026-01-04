import React from "react";
import clsx from "clsx";

interface LayoutProps {
	children: React.ReactNode;
	className?: string;
}

export const Layout = ({ children, className, ...props }: LayoutProps) => {
	return (
		<div
			className={clsx(
				"container mx-auto px-4 lg:my-10 mt-3 mb-10 text-center",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
};
export const LayoutWithHeader = ({ children, ...props }: LayoutProps) => (
	<Layout {...props}>{children}</Layout>
);
