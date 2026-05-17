import type React from "react";

// Component Props Types
export interface CustomListItemProps
	extends Omit<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		"className" | "style"
	> {
	label?: React.ReactNode;
	description?: string;
	startAdornment?: React.ReactNode;
	endAdornment?: React.ReactNode;
	children?: React.ReactNode;
	disabled?: boolean;
	href?: string;
	noPointer?: boolean;
}
