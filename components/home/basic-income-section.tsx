"use client";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import {
	PiHandCoinsFill,
	PiInfoFill,
	PiWarningCircleFill,
	PiWarningFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LearnMoreDialog } from "@/components/learn-more-dialog";
import { SelfVerificationDialog } from "@/components/self-verification-dialog";
import { useBasicIncome } from "@/hooks/use-basic-income";
import { getSafeLocale } from "@/lib/locale";
import { getMinWithdrawalAmount } from "@/lib/withdrawal-limits";

interface BasicIncomeSectionProps {
	lang: string;
	dictionary: Dictionary;
	isRaisedByHumanityBrand: boolean;
	isActive?: boolean;
	isAuthenticated: boolean;
	userUuid: string | null;
	isSelfVerified: boolean;
	basicIncomeActivatedAt: number | null;
	lastBasicIncomeClaimAt: number | null;
	basicIncomeAndInterestClaimedTotal: number | null;
	onSignIn: () => void;
	onSuccess: () => void;
}

export function BasicIncomeSection({
	lang,
	dictionary,
	isRaisedByHumanityBrand,
	isActive = true,
	isAuthenticated,
	userUuid,
	isSelfVerified,
	basicIncomeActivatedAt,
	lastBasicIncomeClaimAt,
	basicIncomeAndInterestClaimedTotal,
	onSignIn,
	onSuccess,
}: BasicIncomeSectionProps) {
	const nonWithdrawableBalanceBuffer = 0.01;
	const capAmount = Math.max(
		0,
		getMinWithdrawalAmount("8453") - nonWithdrawableBalanceBuffer,
	);
	const claimedTotal = basicIncomeAndInterestClaimedTotal ?? 0;
	const yellowWarningThreshold = capAmount * 0.7;
	const redWarningThreshold = capAmount * 0.9;
	const isRedCapWarning =
		!isSelfVerified && claimedTotal >= redWarningThreshold;
	const isYellowCapWarning =
		!isSelfVerified &&
		claimedTotal >= yellowWarningThreshold &&
		claimedTotal < redWarningThreshold;
	const learnMoreWarningLevel = isRedCapWarning
		? "red"
		: isYellowCapWarning
			? "yellow"
			: undefined;
	const raisedButtonShadowClass =
		"shadow-[0_4px_10px_rgba(0,0,0,0.19)]! disabled:shadow-none! transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow]!";
	const [isLearnMoreDialogOpen, setIsLearnMoreDialogOpen] = useState(false);
	const [isSelfVerificationOpen, setIsSelfVerificationOpen] = useState(false);
	const renderInfoSubtitle = (text: string) => (
		<Typography
			variant="subtitle"
			level={2}
			className="mx-auto text-center text-gray-500"
		>
			{text}
			<span className="inline-flex shrink-0 items-center">
				<button
					type="button"
					onClick={() => setIsLearnMoreDialogOpen(true)}
					className="inline-flex shrink-0 items-center justify-center text-gray-400"
					aria-label={dictionary.pages.govern.parties.learn_more}
				>
					{isRedCapWarning ? (
						<PiWarningFill className="ml-1 size-4 translate-y-[2px]! text-red-500" />
					) : isYellowCapWarning ? (
						<PiWarningCircleFill className="ml-1 size-4 translate-y-[2px]! text-yellow-500" />
					) : (
						<PiInfoFill className="ml-1 size-4 translate-y-[2px]!" />
					)}
				</button>
			</span>
		</Typography>
	);

	const {
		isActivating,
		isClaiming,
		claimableAmount,
		maxClaimableAmount,
		handleActivate,
		handleClaim,
	} = useBasicIncome(
		dictionary,
		basicIncomeActivatedAt,
		lastBasicIncomeClaimAt,
		basicIncomeAndInterestClaimedTotal,
		isSelfVerified,
		isActive,
		onSuccess,
	);

	const locale = getSafeLocale(lang);
	const isCapReached = !isSelfVerified && claimedTotal >= capAmount - 1e-9;
	const displayAmount = isCapReached ? claimableAmount : maxClaimableAmount;
	const amountString = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 6,
		maximumFractionDigits: 6,
	}).format(displayAmount);
	const unauthSubtitle = isRaisedByHumanityBrand
		? dictionary.pages.earn.basic_income.subtitle_unauth_raised_by_humanity
		: dictionary.pages.earn.basic_income.subtitle_unauth;

	if (!isAuthenticated) {
		return (
			<div className="flex grow items-center justify-center">
				<div className="flex w-full flex-col items-center p-6">
					<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
						<PiHandCoinsFill className="h-10 w-10 text-gray-400" />
					</div>
					<div className="flex w-full flex-col items-center gap-4">
						<Typography variant="heading" level={2}>
							{dictionary.pages.earn.tabs.basic_income}
						</Typography>
						{renderInfoSubtitle(unauthSubtitle)}
						<LearnMoreDialog
							open={isLearnMoreDialogOpen}
							onOpenChange={setIsLearnMoreDialogOpen}
							title={dictionary.pages.earn.tabs.basic_income}
							info={dictionary.pages.earn.basic_income.tooltip_claim}
							warningLevel={learnMoreWarningLevel}
							warningText={
								dictionary.components.identity.verification_warning
									.reward_cap_banner
							}
							showVerifyCta={Boolean(learnMoreWarningLevel)}
							verifyCtaLabel={
								dictionary.components.identity.verification_warning.title
							}
							onVerifyClick={() => setIsSelfVerificationOpen(true)}
							externalLink={{
								url: "https://wiki.worldrepublic.org/building-blocks/world-drachma",
								label: dictionary.pages.earn.basic_income.world_drachma,
							}}
						/>
						<div className="mt-6 w-full">
							<Button
								fullWidth
								className={raisedButtonShadowClass}
								onClick={onSignIn}
							>
								{dictionary.common.sign_in}
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!basicIncomeActivatedAt) {
		return (
			<div className="flex grow items-center justify-center">
				<div className="flex w-full flex-col items-center p-6">
					<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
						<PiHandCoinsFill className="h-10 w-10 text-gray-400" />
					</div>
					<div className="flex w-full flex-col items-center gap-4">
						<Typography variant="heading" level={2}>
							{dictionary.pages.earn.tabs.basic_income}
						</Typography>
						{renderInfoSubtitle(
							dictionary.pages.earn.basic_income.setup_subtitle,
						)}
						<LearnMoreDialog
							open={isLearnMoreDialogOpen}
							onOpenChange={setIsLearnMoreDialogOpen}
							title={dictionary.pages.earn.tabs.basic_income}
							info={dictionary.pages.earn.basic_income.tooltip_claim}
							warningLevel={learnMoreWarningLevel}
							warningText={
								dictionary.components.identity.verification_warning
									.reward_cap_banner
							}
							showVerifyCta={Boolean(learnMoreWarningLevel)}
							verifyCtaLabel={
								dictionary.components.identity.verification_warning.title
							}
							onVerifyClick={() => setIsSelfVerificationOpen(true)}
							externalLink={{
								url: "https://wiki.worldrepublic.org/building-blocks/world-drachma",
								label: dictionary.pages.earn.basic_income.world_drachma,
							}}
						/>
						<Button
							fullWidth
							className={`mt-6! ${raisedButtonShadowClass}`}
							onClick={handleActivate}
							disabled={isActivating}
						>
							{isActivating
								? dictionary.pages.earn.basic_income.activate_loading
								: dictionary.pages.earn.basic_income.activate_button}
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex grow items-center justify-center">
			<div className="flex w-full flex-col items-center p-6">
				<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
					<PiHandCoinsFill className="h-10 w-10 text-gray-400" />
				</div>
				<div className="flex w-full flex-col items-center gap-4">
					<Typography variant="heading" level={2}>
						{dictionary.pages.earn.tabs.basic_income}
					</Typography>
					{renderInfoSubtitle(
						dictionary.pages.earn.basic_income.subtitle_claim,
					)}
					<LearnMoreDialog
						open={isLearnMoreDialogOpen}
						onOpenChange={setIsLearnMoreDialogOpen}
						title={dictionary.pages.earn.tabs.basic_income}
						info={dictionary.pages.earn.basic_income.tooltip_claim}
						warningLevel={learnMoreWarningLevel}
						warningText={
							dictionary.components.identity.verification_warning
								.reward_cap_banner
						}
						showVerifyCta={Boolean(learnMoreWarningLevel)}
						verifyCtaLabel={
							dictionary.components.identity.verification_warning.title
						}
						onVerifyClick={() => setIsSelfVerificationOpen(true)}
						externalLink={{
							url: "https://wiki.worldrepublic.org/building-blocks/world-drachma",
							label: dictionary.pages.earn.basic_income.world_drachma,
						}}
					/>
					<div className="mt-5 mb-1 font-mono text-7xl font-semibold">
						{amountString}
					</div>
					{isCapReached ? (
						<Button
							fullWidth
							className={`mt-6! ${raisedButtonShadowClass}`}
							onClick={() => {
								if (!isAuthenticated || !userUuid) {
									onSignIn();
									return;
								}
								setIsSelfVerificationOpen(true);
							}}
						>
							{dictionary.components.identity.verification_warning.title}
						</Button>
					) : (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									fullWidth
									className={`mt-6! ${raisedButtonShadowClass}`}
									disabled={isClaiming || maxClaimableAmount <= 0}
								>
									{dictionary.pages.earn.basic_income.claim_button}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiHandCoinsFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<AlertDialogTitle>
										{dictionary.pages.earn.basic_income.alert.claim.title}
									</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogDescription>
									{dictionary.pages.earn.basic_income.alert.claim.description.replace(
										"{amount}",
										amountString,
									)}
								</AlertDialogDescription>
								<AlertDialogFooter>
									<AlertDialogClose asChild>
										<Button onClick={handleClaim} fullWidth>
											{dictionary.common.confirm}
										</Button>
									</AlertDialogClose>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>
			<SelfVerificationDialog
				open={isSelfVerificationOpen}
				onOpenChange={setIsSelfVerificationOpen}
				onSuccess={onSuccess}
				userId={userUuid}
				dictionary={dictionary}
				mode="account"
			/>
		</div>
	);
}
