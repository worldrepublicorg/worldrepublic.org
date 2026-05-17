"use client";

interface ScrollToTopButtonProps {
	show: boolean;
	onClick: () => void;
}

export function ScrollToTopButton({ show, onClick }: ScrollToTopButtonProps) {
	if (!show) return null;

	return (
		<button
			type="button"
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
			onTouchStart={(e) => {
				// Prevent scroll interference and stop propagation to prevent BottomNav from capturing this touch
				e.preventDefault();
				e.stopPropagation();
				onClick();
			}}
			onTouchEnd={(e) => {
				// Stop propagation to ensure BottomNav doesn't capture this touch
				e.stopPropagation();
			}}
			className="scroll-to-top-bottom fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 shadow-lg! touch-manipulation"
			aria-label="Scroll to top"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="pointer-events-none text-gray-500"
				aria-hidden
			>
				<title>Scroll to top</title>
				<path d="m18 15-6-6-6 6" />
			</svg>
		</button>
	);
}
