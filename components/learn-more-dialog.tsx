"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	Button,
	Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import {
	PiArrowSquareOut,
	PiInfoFill,
	PiWarning,
	PiWarningCircle,
} from "react-icons/pi";
import { CustomListItem } from "@/components/custom-list-item";

type LearnMoreWarningLevel = "yellow" | "red";

interface LearnMoreDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	/** Optional info text displayed in the drawer body */
	info?: string;
	/** Optional external link - renders like Menu page links (PiArrowSquareOut) without start icon */
	externalLink?: { url: string; label: string };
	/** Optional warning banner shown before the external link */
	warningLevel?: LearnMoreWarningLevel;
	/** Optional warning copy shown when warningLevel is provided */
	warningText?: string;
	/** Optional CTA shown alongside warning banner */
	showVerifyCta?: boolean;
	/** Optional CTA label */
	verifyCtaLabel?: string;
	/** Optional CTA click handler */
	onVerifyClick?: () => void;
}

/**
 * A drawer similar to the "Select type" drawer on the Wallet page.
 * Displays "Learn more" (or custom title), optional info text, and/or
 * an external link styled like Menu page links (with arrow icon, no start icon).
 */
export function LearnMoreDialog({
	open,
	onOpenChange,
	title,
	info,
	externalLink,
	warningLevel,
	warningText,
	showVerifyCta = false,
	verifyCtaLabel,
	onVerifyClick,
}: LearnMoreDialogProps) {
	const warningBannerText = warningLevel ? warningText : null;
	const warningBannerClassName =
		warningLevel === "red" ? "bg-red-50" : "bg-yellow-50";
	const warningIconClassName =
		warningLevel === "red"
			? "size-5 shrink-0 text-red-500"
			: "size-5 shrink-0 text-yellow-500";
	const warningTextClassName =
		warningLevel === "red" ? "text-red-500" : "text-yellow-500";

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader
					icon={
						<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
							<PiInfoFill className="h-[30px] w-[30px] text-gray-400" />
						</div>
					}
				>
					<Typography variant="heading" level={3}>
						{title}
					</Typography>
				</AlertDialogHeader>

				{info &&
					(externalLink || warningLevel ? (
						<AlertDialogDescription
							className={`text-gray-500 ${
								warningLevel ? "mb-4!" : externalLink ? "mb-6!" : "mb-6!"
							}`}
						>
							{info}
						</AlertDialogDescription>
					) : (
						<Typography className="text-gray-500">{info}</Typography>
					))}

				{externalLink && (
					<div className="w-full">
						<a
							href={externalLink.url}
							target="_blank"
							rel="noopener noreferrer"
							className="block w-full"
						>
							<CustomListItem
								label={externalLink.label}
								endAdornment={
									<PiArrowSquareOut className="size-4 text-gray-400" />
								}
							/>
						</a>
					</div>
				)}

				{warningLevel && warningBannerText && (
					<div
						className={`${externalLink ? "mt-4! " : ""}flex h-full w-full items-center justify-center rounded-2xl p-4 text-center ${warningBannerClassName}`}
					>
						<div className="flex items-start gap-3">
							{warningLevel === "red" ? (
								<PiWarning className={warningIconClassName} />
							) : (
								<PiWarningCircle className={warningIconClassName} />
							)}
							<Typography
								variant="body"
								level={4}
								className={`text-left text-[14px] font-medium ${warningTextClassName}`}
							>
								{warningBannerText}
							</Typography>
						</div>
					</div>
				)}

				{showVerifyCta && onVerifyClick && (
					<div className="mt-6">
						<AlertDialogFooter>
							<Button fullWidth onClick={onVerifyClick}>
								{verifyCtaLabel}
							</Button>
						</AlertDialogFooter>
					</div>
				)}
			</AlertDialogContent>
		</AlertDialog>
	);
}
