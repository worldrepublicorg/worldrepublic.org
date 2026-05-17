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
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PiClockCountdownFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const SelfVerificationDialog = dynamic(
	() =>
		import("@/components/self-verification-dialog").then(
			(mod) => mod.SelfVerificationDialog,
		),
	{ ssr: false },
);

interface VoteButtonProps {
	fullWidth?: boolean;
	className?: string;
	label?: string;
	/** Optional size, forwarded to the underlying UI kit Button. Defaults to "lg". */
	size?: "sm" | "lg";
	/** Dictionary for i18n strings. */
	dictionary: Dictionary;
	partyId?: string;
	/** When provided, skips the "no active election" dialog and goes directly to Self verification. */
	electionId?: string;
}

export function VoteButton({
	fullWidth = false,
	className,
	label,
	size = "lg",
	dictionary,
	partyId,
	electionId,
}: VoteButtonProps) {
	const router = useRouter();
	const buttonLabel = label || dictionary.common.vote;

	const [preVerificationDialogOpen, setPreVerificationDialogOpen] =
		useState(false);
	const [selfVerificationDialogOpen, setSelfVerificationDialogOpen] =
		useState(false);
	// Generate a random UUID for self-verification
	const [randomUserId, setRandomUserId] = useState<string | null>(null);

	// Generate random UUID on mount
	useEffect(() => {
		if (typeof window !== "undefined" && !randomUserId) {
			const uuid = crypto.randomUUID();
			setRandomUserId(uuid);
		}
	}, [randomUserId]);

	const handlePreVerifyClick = () => {
		setPreVerificationDialogOpen(false);
		setSelfVerificationDialogOpen(true);
	};

	const handleVoteClick = () => {
		if (electionId) {
			// Direct vote flow — go straight to Self verification
			setSelfVerificationDialogOpen(true);
		} else {
			// Legacy flow — show pre-verification dialog
			setPreVerificationDialogOpen(true);
		}
	};

	const handleVerificationSuccess = async () => {
		router.refresh();
	};

	return (
		<>
			<Button
				fullWidth={fullWidth}
				className={className}
				size={size}
				onClick={handleVoteClick}
			>
				{buttonLabel}
			</Button>

			{/* Pre-verification dialog (legacy flow when no electionId) */}
			{!electionId && (
				<AlertDialog
					open={preVerificationDialogOpen}
					onOpenChange={setPreVerificationDialogOpen}
				>
					<AlertDialogContent>
						<AlertDialogHeader
							icon={
								<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
									<PiClockCountdownFill className="h-[30px] w-[30px] text-gray-400" />
								</div>
							}
						>
							<Typography variant="heading" level={3}>
								{dictionary.pages.govern.vote.no_active_election}
							</Typography>
						</AlertDialogHeader>
						<AlertDialogDescription>
							<Typography>
								{dictionary.pages.govern.vote.test_verification.description}
							</Typography>
						</AlertDialogDescription>
						<AlertDialogFooter>
							<Button onClick={handlePreVerifyClick} className="w-full">
								{dictionary.pages.govern.vote.test_verification.button}
							</Button>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}

			{/* Self verification dialog */}
			<SelfVerificationDialog
				open={selfVerificationDialogOpen}
				onOpenChange={setSelfVerificationDialogOpen}
				onSuccess={handleVerificationSuccess}
				userId={randomUserId}
				dictionary={dictionary}
				partyId={partyId}
				electionId={electionId}
			/>
		</>
	);
}
