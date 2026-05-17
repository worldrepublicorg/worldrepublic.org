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
	Pill,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useMemo, useState } from "react";
import {
	PiCaretDown,
	PiCoinsFill,
	PiHandArrowDownFill,
	PiHandArrowUpFill,
	PiInfoFill,
	PiPiggyBankFill,
	PiWarningCircleFill,
	PiWarningFill,
} from "react-icons/pi";
import { useConnection } from "wagmi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { ConnectWalletButton } from "@/components/home/connect-wallet-button";
import { LearnMoreDialog } from "@/components/learn-more-dialog";
import { SelfVerificationDialog } from "@/components/self-verification-dialog";
import { useBaseChainGuard } from "@/hooks/use-base-chain-guard";
import { useBaseChainSavingsAccount } from "@/hooks/use-base-chain-savings-account";
import { useSavings } from "@/hooks/use-savings";
import { formatTxError } from "@/lib/format-tx-error";
import { getSafeLocale } from "@/lib/locale";
import { cn, formatFullAmount, getRewardDecimals } from "@/lib/utils";
import { getMinWithdrawalAmount } from "@/lib/withdrawal-limits";

export type SavingsAccountType = "offchain" | "base_chain";

interface SavingsSectionProps {
	lang: string;
	dictionary: Dictionary;
	isActive?: boolean;
	isAuthenticated: boolean;
	userUuid: string | null;
	walletBalance: number;
	savingsBalance: number;
	unclaimedSavingsInterest: number;
	basicIncomeAndInterestClaimedTotal: number;
	isSelfVerified: boolean;
	savingsLastUpdatedAt: number | null;
	onSuccess: () => Promise<void> | void;
	onSignIn: () => void;
	selectedSavingsAccount: SavingsAccountType;
	onSelectedSavingsAccountChange: (value: SavingsAccountType) => void;
}

export function SavingsSection({
	lang,
	dictionary,
	isActive = true,
	isAuthenticated,
	userUuid,
	walletBalance,
	savingsBalance,
	unclaimedSavingsInterest,
	basicIncomeAndInterestClaimedTotal,
	isSelfVerified,
	savingsLastUpdatedAt,
	onSuccess,
	onSignIn,
	selectedSavingsAccount,
	onSelectedSavingsAccountChange,
}: SavingsSectionProps) {
	const { isConnected: isWalletConnected } = useConnection();
	const { toast } = useToast();
	const { isOnBaseChain, isSwitching, switchToBaseChain } = useBaseChainGuard();
	const savingsAccountOptions = [
		{ value: "offchain", label: "Offchain" },
		{ value: "base_chain", label: "Base Chain" },
	] as const;
	const raisedButtonShadowClass =
		"shadow-[0_4px_10px_rgba(0,0,0,0.19)]! disabled:shadow-none! transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow]!";
	const [selectedAction, setSelectedAction] = useState<"deposit" | "withdraw">(
		"deposit",
	);
	const [isLearnMoreDialogOpen, setIsLearnMoreDialogOpen] = useState(false);
	const [isSavingsAccountDialogOpen, setIsSavingsAccountDialogOpen] =
		useState(false);
	const [collectDialogOpen, setCollectDialogOpen] = useState(false);
	const [depositDialogOpen, setDepositDialogOpen] = useState(false);
	const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
	const [isSelfVerificationOpen, setIsSelfVerificationOpen] = useState(false);

	const {
		amount,
		setAmount,
		isSavingsLoading,
		displayAvailableInterest,
		maxCollectableAmount,
		handleDeposit,
		handleWithdraw,
		handleCollectInterest,
	} = useSavings(
		dictionary,
		savingsBalance,
		unclaimedSavingsInterest,
		savingsLastUpdatedAt,
		basicIncomeAndInterestClaimedTotal,
		isSelfVerified,
		isActive,
		onSuccess,
	);
	const baseChainAccount = useBaseChainSavingsAccount();
	const baseChainWalletBalance = baseChainAccount.balances.wallet;
	const baseChainSavingsBalance = baseChainAccount.balances.savings;
	const baseChainAvailableInterest = baseChainAccount.interest.available;
	const isBaseChainAccountSelected = selectedSavingsAccount === "base_chain";
	const isOffchainAccountSelected = !isBaseChainAccountSelected;
	const isCurrentAccountLoading = isBaseChainAccountSelected
		? baseChainAccount.status.isLoading
		: isSavingsLoading;
	const displayWalletBalance = isBaseChainAccountSelected
		? baseChainWalletBalance
		: walletBalance;
	const displaySavingsBalance = isBaseChainAccountSelected
		? baseChainSavingsBalance
		: savingsBalance;
	const displayCollectableAmount = isBaseChainAccountSelected
		? baseChainAvailableInterest
		: maxCollectableAmount;

	const maxButtonAmount = useMemo(() => {
		const source =
			selectedAction === "deposit"
				? displayWalletBalance
				: displaySavingsBalance;
		const safeAmount = Math.max(0, source - 1e-12);
		return formatFullAmount(safeAmount);
	}, [selectedAction, displayWalletBalance, displaySavingsBalance]);
	const rewardDecimals = getRewardDecimals(displaySavingsBalance);
	const locale = getSafeLocale(lang);
	const savingsBalanceDisplay = new Intl.NumberFormat(locale, {
		minimumFractionDigits: 4,
		maximumFractionDigits: 4,
	}).format(Math.floor(displaySavingsBalance * 10000) / 10000);
	const decimalSeparator =
		new Intl.NumberFormat(locale)
			.formatToParts(1.1)
			.find((part) => part.type === "decimal")?.value ?? ".";

	const toCanonicalAmount = (input: string): string => {
		let normalized = input.trim().replace(/\s+/g, "");
		if (decimalSeparator !== ".") {
			normalized = normalized.split(decimalSeparator).join(".");
		}
		// Accept comma as decimal separator as a fallback.
		normalized = normalized.replace(/,/g, ".");
		normalized = normalized.replace(/[^0-9.]/g, "");

		const firstDot = normalized.indexOf(".");
		if (firstDot !== -1) {
			normalized =
				normalized.slice(0, firstDot + 1) +
				normalized.slice(firstDot + 1).replace(/\./g, "");
		}

		if (normalized.startsWith(".")) {
			normalized = `0${normalized}`;
		}
		return normalized;
	};

	const toLocalizedInputAmount = (canonicalAmount: string): string => {
		if (!canonicalAmount) return "";

		const hasTrailingDot = canonicalAmount.endsWith(".");
		const numericPart = hasTrailingDot
			? canonicalAmount.slice(0, -1)
			: canonicalAmount;
		const parsed = Number(numericPart);

		if (!Number.isFinite(parsed)) {
			return canonicalAmount;
		}

		const fractionDigits = numericPart.includes(".")
			? (numericPart.split(".")[1]?.length ?? 0)
			: 0;
		const formatted = new Intl.NumberFormat(locale, {
			useGrouping: false,
			minimumFractionDigits: fractionDigits,
			maximumFractionDigits: fractionDigits,
		}).format(parsed);

		return hasTrailingDot ? `${formatted}${decimalSeparator}` : formatted;
	};

	const localizedAmountInput = toLocalizedInputAmount(amount);
	const normalizedAmount = amount.trim().replace(",", ".");
	const parsedAmount = Number(normalizedAmount);
	const amountFractionDigits = normalizedAmount.includes(".")
		? (normalizedAmount.split(".")[1]?.length ?? 0)
		: 0;
	const amountDisplay = Number.isFinite(parsedAmount)
		? new Intl.NumberFormat(locale, {
				minimumFractionDigits: amountFractionDigits,
				maximumFractionDigits: amountFractionDigits,
			}).format(parsedAmount)
		: amount || "0";

	const hasInsufficientBalance = () => {
		if (!amount || Number(amount) <= 0) return false;
		const entered = Number(amount);
		const source =
			selectedAction === "deposit"
				? displayWalletBalance
				: displaySavingsBalance;
		return entered > source + 1e-9;
	};

	const getActionButtonText = () => {
		if (!amount || Number(amount) <= 0) {
			return selectedAction === "deposit"
				? dictionary.pages.earn.savings.deposit
				: dictionary.pages.earn.savings.withdraw;
		}
		if (hasInsufficientBalance()) return dictionary.common.insufficient_balance;
		return selectedAction === "deposit"
			? dictionary.pages.earn.savings.deposit
			: dictionary.pages.earn.savings.withdraw;
	};

	const isActionDisabled =
		isCurrentAccountLoading ||
		(isBaseChainAccountSelected && isWalletConnected && !isOnBaseChain) ||
		(isOffchainAccountSelected && !isAuthenticated) ||
		!amount ||
		Number(amount) <= 0 ||
		hasInsufficientBalance();
	const selectedSavingsAccountLabel =
		savingsAccountOptions.find(
			(option) => option.value === selectedSavingsAccount,
		)?.label ?? savingsAccountOptions[0].label;
	const showBaseChainConnectCta =
		isBaseChainAccountSelected && !isWalletConnected;
	const showBaseChainSwitchCta =
		isBaseChainAccountSelected && isWalletConnected && !isOnBaseChain;
	const nonWithdrawableBalanceBuffer = 0.01;
	const capAmount = Math.max(
		0,
		getMinWithdrawalAmount("8453") - nonWithdrawableBalanceBuffer,
	);
	const yellowWarningThreshold = capAmount * 0.7;
	const redWarningThreshold = capAmount * 0.9;
	const isRedCapWarning =
		isOffchainAccountSelected &&
		!isSelfVerified &&
		basicIncomeAndInterestClaimedTotal >= redWarningThreshold;
	const isYellowCapWarning =
		isOffchainAccountSelected &&
		!isSelfVerified &&
		basicIncomeAndInterestClaimedTotal >= yellowWarningThreshold &&
		basicIncomeAndInterestClaimedTotal < redWarningThreshold;
	const learnMoreWarningLevel = isRedCapWarning
		? "red"
		: isYellowCapWarning
			? "yellow"
			: undefined;
	const isCapReached =
		isOffchainAccountSelected &&
		!isSelfVerified &&
		basicIncomeAndInterestClaimedTotal >= capAmount - 1e-9;
	const displayCollectableAmountRaw =
		isCapReached && isOffchainAccountSelected
			? displayAvailableInterest
			: displayCollectableAmount;
	const collectableAmountForUi = Number(
		displayCollectableAmountRaw.toFixed(rewardDecimals),
	);
	const collectableAmountDisplay = new Intl.NumberFormat(locale, {
		minimumFractionDigits: rewardDecimals,
		maximumFractionDigits: rewardDecimals,
	}).format(collectableAmountForUi);

	return (
		<div className="flex grow items-center justify-center">
			<div className="flex w-full flex-col items-center p-6">
				<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
					<PiPiggyBankFill className="h-10 w-10 text-gray-400" />
				</div>

				<div className="flex w-full flex-col items-center gap-4">
					<Typography variant="heading" level={2}>
						{dictionary.pages.earn.savings.title}
					</Typography>
					<Typography
						variant="subtitle"
						level={2}
						className="mx-auto text-center text-gray-500"
					>
						{dictionary.pages.earn.savings.subtitle}
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
					<LearnMoreDialog
						open={isLearnMoreDialogOpen}
						onOpenChange={setIsLearnMoreDialogOpen}
						title={dictionary.pages.earn.savings.title}
						info={dictionary.pages.earn.savings.tooltip}
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
						externalLink={
							isBaseChainAccountSelected
								? {
										url: "https://basescan.org/address/0xeFE5a120c2787ee53FbebAE8902bdDe1edE416Fc#code",
										label: dictionary.pages.earn.savings.smart_contract_link,
									}
								: undefined
						}
					/>
				</div>

				<div className="mt-6 w-full">
					<div className="mb-2 flex items-center justify-between gap-1">
						<div className="flex gap-1">
							<Pill
								checked={selectedAction === "deposit"}
								onClick={() => {
									setSelectedAction("deposit");
									setAmount("");
								}}
							>
								{dictionary.pages.earn.savings.deposit}
							</Pill>
							<Pill
								checked={selectedAction === "withdraw"}
								onClick={() => {
									setSelectedAction("withdraw");
									setAmount("");
								}}
							>
								{dictionary.pages.earn.savings.withdraw}
							</Pill>
						</div>
						<button
							type="button"
							onClick={() => setIsSavingsAccountDialogOpen(true)}
							className="flex h-9 min-w-fit items-center justify-between gap-1 rounded-full border-0 bg-gray-100 px-4 font-sans text-sm font-semibold text-gray-900"
						>
							<span>{selectedSavingsAccountLabel}</span>
							<PiCaretDown className="size-3.5 text-gray-400" />
						</button>
					</div>

					<div className="mb-4 rounded-xl border border-gray-200 p-4">
						<div className="flex items-center justify-between">
							<Typography
								as="p"
								variant="body"
								level={2}
								className="mb-4 text-[17px] font-medium text-gray-900"
							>
								{dictionary.pages.earn.savings.balance}
							</Typography>
							<Typography
								variant="number"
								level={5}
								className="mb-4 font-['Rubik'] text-base"
							>
								{savingsBalanceDisplay} WDD
							</Typography>
						</div>
						<div className="flex items-center justify-between">
							<input
								type="text"
								inputMode="decimal"
								lang={locale}
								value={localizedAmountInput}
								onChange={(e) => setAmount(toCanonicalAmount(e.target.value))}
								placeholder={
									selectedAction === "deposit"
										? dictionary.pages.earn.savings.amount_deposit
										: dictionary.pages.earn.savings.amount_withdraw
								}
								className={cn(
									"mr-2 -ml-2 h-9 w-full rounded-xl focus:outline-none",
									amount ? "font-['Rubik']! text-[17px]!" : "font-sans",
								)}
							/>
							<button
								type="button"
								onClick={() => setAmount(maxButtonAmount)}
								className={cn(
									"leading-narrow flex h-9 items-center justify-center rounded-full bg-gray-100 px-4 font-sans text-sm font-medium tracking-normal whitespace-nowrap",
									"text-gray-900",
								)}
							>
								{dictionary.common.max}
							</button>
						</div>
					</div>

					<div className="mt-4 mb-6 flex items-center justify-between gap-2 px-2">
						<Typography
							as="p"
							variant="body"
							level={2}
							className="text-[17px] font-medium text-gray-900"
						>
							{dictionary.pages.earn.savings.interest}
						</Typography>
						<div className="flex items-center gap-2">
							{isCapReached ? (
								<Button
									variant="primary"
									size="sm"
									className={`mr-2 h-9 min-w-20 rounded-full px-4 font-sans ${raisedButtonShadowClass}`}
									onClick={() => {
										if (!isAuthenticated || !userUuid) {
											onSignIn();
											return;
										}
										setIsSelfVerificationOpen(true);
									}}
								>
									{dictionary.pages.earn.savings.verify}
								</Button>
							) : (
								<AlertDialog
									open={collectDialogOpen}
									onOpenChange={setCollectDialogOpen}
								>
									<AlertDialogTrigger asChild>
										<Button
											disabled={
												(isOffchainAccountSelected && !isAuthenticated) ||
												showBaseChainSwitchCta ||
												isCurrentAccountLoading ||
												collectableAmountForUi <= 0
											}
											variant="primary"
											size="sm"
											className={`mr-2 h-9 min-w-20 rounded-full px-4 font-sans ${raisedButtonShadowClass}`}
										>
											{dictionary.pages.earn.savings.collect}
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader
											icon={
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
													<PiCoinsFill className="h-[30px] w-[30px] text-gray-400" />
												</div>
											}
										>
											<AlertDialogTitle>
												{dictionary.pages.earn.savings.alert.collect.title}
											</AlertDialogTitle>
										</AlertDialogHeader>
										<AlertDialogDescription>
											{dictionary.pages.earn.savings.alert.collect.description.replace(
												"{amount}",
												collectableAmountDisplay,
											)}
										</AlertDialogDescription>
										<AlertDialogFooter>
											<AlertDialogClose asChild>
												<Button
													onClick={async () => {
														try {
															if (isBaseChainAccountSelected) {
																await baseChainAccount.actions.collect();
															} else {
																await handleCollectInterest();
															}
														} catch (err) {
															toast.error({ title: formatTxError(err) });
														} finally {
															setCollectDialogOpen(false);
														}
													}}
													disabled={isCurrentAccountLoading}
													fullWidth
												>
													{dictionary.common.confirm}
												</Button>
											</AlertDialogClose>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							)}
							<Typography
								variant="number"
								level={5}
								className="font-['Rubik'] text-base"
							>
								{collectableAmountDisplay}
							</Typography>
						</div>
					</div>

					{showBaseChainConnectCta ? (
						<ConnectWalletButton
							variant="primary"
							fullWidth
							compact={false}
							className={raisedButtonShadowClass}
							connectLabel={dictionary.common.connect_wallet}
							disconnectLabel={dictionary.common.disconnect}
							disconnectDescription={
								dictionary.pages.wallet.modals.disconnect.confirm
							}
							walletBrowserDialogTitle={
								dictionary.pages.wallet.modals.connect_wallet_browser.title
							}
							walletBrowserDialogDescription={
								dictionary.pages.wallet.modals.connect_wallet_browser
									.description
							}
							walletBrowserDialogButtonLabel={
								dictionary.pages.wallet.modals.connect_wallet_browser.copy_link
							}
							walletPickerDialogDescription={
								dictionary.pages.wallet.modals.connect_wallet_picker.description
							}
							noWalletDialogDescription={
								dictionary.pages.wallet.modals.connect_wallet_no_wallet
									.description
							}
							noWalletDialogLinkLabel={
								dictionary.pages.wallet.modals.connect_wallet_no_wallet
									.find_wallet_link
							}
							copiedToastTitle={dictionary.toasts.copied}
							copyErrorToastTitle={dictionary.toasts.generic_error}
							accountTitle={dictionary.pages.wallet.sections.account_label}
							lang={lang}
						/>
					) : showBaseChainSwitchCta ? (
						<Button
							fullWidth
							className={raisedButtonShadowClass}
							disabled={isSwitching}
							onClick={async () => {
								await switchToBaseChain();
							}}
						>
							{isSwitching
								? dictionary.common.loading
								: dictionary.common.switch_to_base_chain}
						</Button>
					) : !isAuthenticated && isOffchainAccountSelected ? (
						<Button
							fullWidth
							className={raisedButtonShadowClass}
							onClick={onSignIn}
						>
							{dictionary.common.sign_in}
						</Button>
					) : selectedAction === "deposit" ? (
						<AlertDialog
							open={depositDialogOpen}
							onOpenChange={setDepositDialogOpen}
						>
							<AlertDialogTrigger asChild>
								<Button
									disabled={isActionDisabled}
									fullWidth
									className={raisedButtonShadowClass}
								>
									{getActionButtonText()}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiHandArrowUpFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<AlertDialogTitle>
										{dictionary.pages.earn.savings.alert.deposit.title}
									</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogDescription>
									{dictionary.pages.earn.savings.alert.deposit.description.replace(
										"{amount}",
										amountDisplay,
									)}
								</AlertDialogDescription>
								<AlertDialogFooter>
									<AlertDialogClose asChild>
										<Button
											onClick={async () => {
												try {
													if (isBaseChainAccountSelected) {
														await baseChainAccount.actions.deposit(amount);
														setAmount("");
													} else {
														await handleDeposit();
													}
												} catch (err) {
													toast.error({ title: formatTxError(err) });
												} finally {
													setDepositDialogOpen(false);
												}
											}}
											disabled={isCurrentAccountLoading}
											fullWidth
										>
											{dictionary.common.confirm}
										</Button>
									</AlertDialogClose>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : (
						<AlertDialog
							open={withdrawDialogOpen}
							onOpenChange={setWithdrawDialogOpen}
						>
							<AlertDialogTrigger asChild>
								<Button
									disabled={isActionDisabled}
									fullWidth
									className={raisedButtonShadowClass}
								>
									{getActionButtonText()}
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiHandArrowDownFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<AlertDialogTitle>
										{dictionary.pages.earn.savings.alert.withdraw.title}
									</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogDescription>
									{dictionary.pages.earn.savings.alert.withdraw.description.replace(
										"{amount}",
										amountDisplay,
									)}
								</AlertDialogDescription>
								<AlertDialogFooter>
									<AlertDialogClose asChild>
										<Button
											onClick={async () => {
												try {
													if (isBaseChainAccountSelected) {
														await baseChainAccount.actions.withdraw(amount);
														setAmount("");
													} else {
														await handleWithdraw();
													}
												} catch (err) {
													toast.error({ title: formatTxError(err) });
												} finally {
													setWithdrawDialogOpen(false);
												}
											}}
											disabled={isCurrentAccountLoading}
											fullWidth
										>
											{dictionary.common.confirm}
										</Button>
									</AlertDialogClose>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			</div>

			<AlertDialog
				open={isSavingsAccountDialogOpen}
				onOpenChange={setIsSavingsAccountDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{dictionary.pages.wallet.transactions.filter.select_type}
						</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<div className="flex w-full flex-col gap-2">
							{savingsAccountOptions.map((option) => (
								<div
									key={option.value}
									className={cn(
										"rounded-2xl",
										selectedSavingsAccount === option.value && "border-2",
									)}
								>
									<CustomListItem
										label={option.label}
										onClick={() => {
											onSelectedSavingsAccountChange(option.value);
											setIsSavingsAccountDialogOpen(false);
										}}
										noPointer={false}
									/>
								</div>
							))}
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
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
