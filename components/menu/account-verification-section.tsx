"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { PiPlus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { SelfVerificationDialog } from "@/components/self-verification-dialog";

interface AccountVerificationSectionProps {
	dictionary: Dictionary;
	authenticated: boolean;
	userId: string | null;
	isSelfVerified: boolean;
	onRequireAuth?: () => void;
	onSuccess?: () => Promise<void> | void;
}

export function AccountVerificationSection({
	dictionary,
	authenticated,
	userId,
	isSelfVerified,
	onRequireAuth,
	onSuccess,
}: AccountVerificationSectionProps) {
	const [isSelfVerificationOpen, setIsSelfVerificationOpen] = useState(false);

	const identityStatusText = isSelfVerified
		? dictionary.components.identity.self.status_completed
		: dictionary.components.identity.self.status_not_completed;

	const handleSelfVerificationClick = () => {
		if (!authenticated || !userId) {
			onRequireAuth?.();
			return;
		}
		if (isSelfVerified) return;
		setIsSelfVerificationOpen(true);
	};

	return (
		<div>
			<div className="mb-4 mt-1.5 flex">
				<Typography variant="subtitle" level={3} className="text-gray-400">
					{dictionary.pages.wallet.sections.verification}
				</Typography>
			</div>
			<CustomListItem
				label={dictionary.components.identity.self.label}
				description={identityStatusText}
				onClick={handleSelfVerificationClick}
				noPointer={authenticated && isSelfVerified}
				endAdornment={
					!isSelfVerified ? (
						<div className="flex items-center text-gray-500">
							<PiPlus className="size-4" />
						</div>
					) : undefined
				}
			/>
			<SelfVerificationDialog
				open={isSelfVerificationOpen}
				onOpenChange={setIsSelfVerificationOpen}
				onSuccess={onSuccess}
				userId={userId}
				dictionary={dictionary}
				mode="account"
			/>
		</div>
	);
}
