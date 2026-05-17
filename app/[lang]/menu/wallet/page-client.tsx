"use client";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
	Button,
	Input,
	Typography,
	useToast,
	WalletAddressField,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	PiArrowCircleUpFill,
	PiArrowSquareOut,
	PiArrowsClockwise,
	PiArrowsClockwiseFill,
	PiArrowUp,
	PiCaretLeft,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

// Lazy load heavy dialog component
const SignInDialog = dynamic(
	() => import("@/components/sign-in-dialog").then((mod) => mod.SignInDialog),
	{ ssr: false },
);

import { CustomListItem } from "@/components/custom-list-item";
import { AccountVerificationSection } from "@/components/menu/account-verification-section";
import { CustomSelect } from "@/components/menu/wallet/custom-select";
import { TransactionHistoryContent } from "@/components/menu/wallet/transaction-history-content";
import { WalletPageSkeleton } from "@/components/menu/wallet/wallet-page-skeleton";
import WddImportInfoBanner from "@/components/menu/wallet/wdd-import-info-banner";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import {
	EMPTY_STREAMS,
	useLiveWalletBalance,
} from "@/hooks/use-live-wallet-balance";
import { useWalletAuthCache } from "@/hooks/use-wallet-auth-cache";
import {
	type GetWalletAuthAndDataResult,
	type GetWalletAuthAndDataTransaction,
	getWalletAuthAndData,
	withdrawTokens,
} from "@/lib/actions/member";
import type { StreamData } from "@/lib/streams";
import { cn, formatFullAmount, truncateToPrecision } from "@/lib/utils";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";
import { getMinWithdrawalAmount } from "@/lib/withdrawal-limits";

const EXCHANGE_ICON_SRCS = [
	"/icons/exchanges/jumper.svg",
	"/icons/exchanges/uniswap.svg",
] as const;

interface WalletPageClientProps {
	lang: string;
	dictionary: Dictionary;
}

export default function WalletPageClient({
	dictionary,
}: WalletPageClientProps) {
	const params = useParams<{ lang: string }>();
	const lang = params.lang;
	const {
		user,
		isAuthenticated: clientIsAuthenticated,
		showSignInDialog,
		setShowSignInDialog,
	} = useAuth();
	const router = useRouter();
	const { toast } = useToast();

	const cachedData = useWalletAuthCache();
	const [serverData, setServerData] =
		useState<GetWalletAuthAndDataResult | null>(null);
	const previousClientAuthRef = useRef(clientIsAuthenticated);
	const hasPreloadedTradeIconsRef = useRef(false);

	const preloadTradeIcons = useCallback(() => {
		if (hasPreloadedTradeIconsRef.current || typeof window === "undefined") {
			return;
		}

		hasPreloadedTradeIconsRef.current = true;

		for (const src of EXCHANGE_ICON_SRCS) {
			const image = new window.Image();
			image.src = src;
		}
	}, []);

	useEffect(() => {
		let cancelled = false;
		const pendingReferral =
			localStorage.getItem("pending_referral") || undefined;
		getWalletAuthAndData(pendingReferral).then((result) => {
			if (cancelled) return;
			setServerData(result);
			setCachedWalletData(result);
			if (pendingReferral && result.authenticated) {
				localStorage.removeItem("pending_referral");
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		preloadTradeIcons();
	}, [preloadTradeIcons]);

	// Re-fetch wallet data when auth state flips to authenticated without navigation
	// (e.g. passkey sign-in on the same page).
	useEffect(() => {
		const becameAuthenticated =
			!previousClientAuthRef.current && clientIsAuthenticated;
		previousClientAuthRef.current = clientIsAuthenticated;

		if (!becameAuthenticated) return;

		let cancelled = false;
		const pendingReferral =
			localStorage.getItem("pending_referral") || undefined;

		getWalletAuthAndData(pendingReferral).then((result) => {
			if (cancelled) return;
			setServerData(result);
			setCachedWalletData(result);
			if (pendingReferral && result.authenticated) {
				localStorage.removeItem("pending_referral");
			}
		});

		return () => {
			cancelled = true;
		};
	}, [clientIsAuthenticated]);

	const data = serverData ?? cachedData;
	const showSkeleton = data === null;
	const profileData = data?.profileData ?? null;
	const isAuthenticated = data?.authenticated ?? false;
	const transactions: GetWalletAuthAndDataTransaction[] =
		data?.transactions ?? [];

	const authenticated = isAuthenticated || clientIsAuthenticated;
	const userStreams: StreamData[] = data?.streams ?? EMPTY_STREAMS;
	const serverBalance = profileData?.walletBalance ?? null;
	const storedWalletBalance = profileData?.storedWalletBalance ?? 0;

	const walletBalance = useLiveWalletBalance(
		data?.streams,
		storedWalletBalance,
		serverBalance,
	);
	const locale = params.lang?.trim() || "en";

	const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

	// Helper function to get address validation error message
	const getAddressValidationError = (address: string): string | null => {
		if (!address) return null;

		// Check if address is a valid EVM address (0x followed by 40 hex characters)
		const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
		if (!evmAddressRegex.test(address)) {
			return dictionary.common.invalid_address;
		}

		// Check if the address is the token's contract address
		const tokenContractAddress = "0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b";
		if (address.toLowerCase() === tokenContractAddress.toLowerCase()) {
			return dictionary.toasts.wallet.contract_address_error;
		}

		return null;
	};

	// State for form validation
	const [walletAddress, setWalletAddress] = useState("");
	const [selectedChain, setSelectedChain] = useState("");
	const [amount, setAmount] = useState("");

	// Handle withdraw action
	const handleWithdraw = async () => {
		if (!user?.id) {
			toast.error({
				title: dictionary.toasts.wallet.no_wallet,
			});
			return;
		}

		// Show immediate feedback that withdrawal is being initiated
		toast.success({
			title: dictionary.common.processing,
		});

		try {
			const result = await withdrawTokens(walletAddress, selectedChain, amount);

			if (result.success && result.transactionId) {
				toast.success({
					title: dictionary.toasts.wallet.sent,
				});

				// Reset form
				setSelectedChain("");
				setAmount("");

				const fresh = await getWalletAuthAndData();
				setServerData(fresh);
				setCachedWalletData(fresh);
				router.refresh();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.generic_error,
				});
			}
		} catch (error) {
			console.error("Error during withdrawal:", error);
			toast.error({
				title: dictionary.toasts.generic_error,
			});
		}
	};

	const displayBalanceNumber = walletBalance || 0;
	const totalBalanceNumber = walletBalance || 0;

	const truncatedDisplay = Math.floor(displayBalanceNumber * 1e18) / 1e18;
	const safeDisplayAmount = Math.max(0, truncatedDisplay - 1e-12);
	const precision = safeDisplayAmount === 0 ? 2 : 5;
	const truncatedDisplayBalance = truncateToPrecision(
		safeDisplayAmount,
		precision,
	);
	const displayBalance = truncatedDisplayBalance.toLocaleString(locale, {
		minimumFractionDigits: precision,
		maximumFractionDigits: precision,
	});

	// Format send balance with small buffer only (no truncation for dialog)
	const safeSendAmount = Math.max(0, totalBalanceNumber - 1e-12);
	const maxWithdrawable = safeSendAmount;
	const totalBalance = formatFullAmount(safeSendAmount);

	// Validation checks
	const isChainSelected = selectedChain !== "";

	// Determine button state and text
	const getButtonState = () => {
		const getMinAmountText = (minAmount: number) =>
			dictionary.toasts.wallet.min_amount.replace(
				/[\p{Nd}]+/u,
				new Intl.NumberFormat(locale).format(minAmount),
			);

		// Check if address is empty first
		if (!walletAddress.trim()) {
			return { disabled: true, text: dictionary.common.invalid_address };
		}

		// Check for address validation errors
		const addressError = getAddressValidationError(walletAddress);
		if (addressError) {
			return { disabled: true, text: addressError };
		}

		const amountNum = parseFloat(amount);

		if (!amount || Number.isNaN(amountNum)) {
			return { disabled: true, text: dictionary.common.withdraw };
		}

		// Keep the default disabled CTA until a chain is chosen.
		if (!isChainSelected) {
			return { disabled: true, text: dictionary.common.withdraw };
		}

		const minAmount = getMinWithdrawalAmount(selectedChain);
		if (amountNum < minAmount) {
			return { disabled: true, text: getMinAmountText(minAmount) };
		}

		if (amountNum > maxWithdrawable) {
			return {
				disabled: true,
				text: dictionary.common.insufficient_balance,
			};
		}

		return { disabled: false, text: dictionary.common.withdraw };
	};

	const buttonState = getButtonState();

	const handleClose = () => {
		const returnUrl = localStorage.getItem("walletReturnUrl");
		if (returnUrl) {
			router.push(returnUrl);
			localStorage.removeItem("walletReturnUrl");
		} else {
			router.push(`/${lang}/`);
		}
	};

	const isSelfVerified = Boolean(profileData?.selfVerifiedAt);

	if (showSkeleton) {
		return <WalletPageSkeleton />;
	}

	return (
		<div className="pb-safe flex flex-col">
			<TopBar
				title={dictionary.pages.wallet.topbar.title}
				startAdornment={
					<button
						type="button"
						onClick={handleClose}
						className="flex size-10 items-center justify-center rounded-full bg-gray-100"
					>
						<PiCaretLeft className="size-4 text-gray-900" />
					</button>
				}
			/>

			<div className="flex flex-col gap-8 p-6">
				{/* WDD Balance Display */}
				<div className="flex flex-col items-center justify-center">
					<Typography
						variant="subtitle"
						level={3}
						className="text-gray-500 mt-1!"
					>
						{dictionary.pages.wallet.balance}
					</Typography>
					<Typography variant="heading" level={1} className="font-mono mt-3!">
						{displayBalance} WDD
					</Typography>

					<div className="flex flex-row w-full justify-around mt-5 px-6">
						{/* Send */}
						{/* Withdraw to Crypto Dialog */}
						<AlertDialog
							open={isWithdrawDialogOpen}
							onOpenChange={(open) => {
								setIsWithdrawDialogOpen(open);
								if (!open) {
									// Reset form when dialog closes
									setWalletAddress("");
									setSelectedChain("");
									setAmount("");
								}
							}}
						>
							<AlertDialogTrigger asChild>
								<div className="flex flex-1 flex-col items-center gap-2 cursor-pointer">
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
										<PiArrowUp className="h-5 w-5 text-gray-900" />
									</div>
									<Typography
										variant="body"
										level={4}
										className="text-gray-900 font-medium"
									>
										{dictionary.pages.wallet.modals.send.button}
									</Typography>
								</div>
							</AlertDialogTrigger>

							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiArrowCircleUpFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<Typography variant="heading" level={3}>
										{dictionary.pages.wallet.modals.send.button}
									</Typography>
								</AlertDialogHeader>

								<AlertDialogDescription className="mb-4">
									{
										dictionary.pages.wallet.modals.send.withdraw_to_crypto
											.description
									}
								</AlertDialogDescription>

								<div className="flex flex-col gap-2">
									<WalletAddressField
										value={walletAddress}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											setWalletAddress(e.target.value)
										}
										label={
											dictionary.pages.wallet.modals.send.withdraw_to_crypto
												.address_label
										}
									/>

									<CustomSelect
										defaultValue=""
										name="chain"
										value={selectedChain}
										onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
											setSelectedChain(e.target.value)
										}
										aria-label={
											dictionary.pages.wallet.modals.send.withdraw_to_crypto
												.network_label
										}
										placeholder={
											dictionary.pages.wallet.modals.send.withdraw_to_crypto
												.network_label
										}
										options={[
											{ label: "Base Chain", value: "8453" },
											{ label: "World Chain", value: "480" },
										]}
									/>

									<Input
										value={amount}
										type="number"
										onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
											setAmount(e.target.value);
										}}
										endAdornment={
											<button
												type="button"
												onClick={() => setAmount(totalBalance)}
												className={cn(
													"leading-narrow flex h-9 items-center justify-center rounded-full font-sans text-sm font-medium tracking-normal whitespace-nowrap",
													amount === totalBalance
														? "text-gray-500"
														: "text-gray-900",
												)}
											>
												{dictionary.common.max}
											</button>
										}
										label={
											dictionary.pages.wallet.modals.send.withdraw_to_crypto
												.amount_label
										}
										className="mb-4"
									/>
								</div>

								{/* WDD Import Info Banner */}
								<div className="mb-6">
									<WddImportInfoBanner dictionary={dictionary} />
								</div>

								<AlertDialogFooter>
									{buttonState.disabled ? (
										<Button
											onClick={handleWithdraw}
											className="w-full"
											disabled={true}
										>
											{buttonState.text}
										</Button>
									) : (
										<AlertDialogClose asChild>
											<Button
												onClick={handleWithdraw}
												className="w-full"
												disabled={false}
											>
												{buttonState.text}
											</Button>
										</AlertDialogClose>
									)}
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>

						{/* Trade */}
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<div className="flex flex-1 flex-col items-center gap-2 cursor-pointer">
									<div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
										<PiArrowsClockwise className="h-5 w-5 text-gray-900" />
									</div>
									<Typography
										variant="body"
										level={4}
										className="text-gray-900 font-medium"
									>
										{dictionary.common.trade}
									</Typography>
								</div>
							</AlertDialogTrigger>

							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiArrowsClockwiseFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<Typography variant="heading" level={3}>
										{dictionary.common.trade}
									</Typography>
								</AlertDialogHeader>

								<AlertDialogFooter>
									<div className="flex flex-col gap-2 w-full">
										{/* <a
                      href="https://jumper.exchange/?toChain=1&toToken=0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade.ethereum_jumper
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/jumper.svg"
                            alt="Jumper"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a>
                    <a
                      href="https://app.uniswap.org/explore/tokens/ethereum/0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade.ethereum_uniswap
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/uniswap.svg"
                            alt="Uniswap"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a> */}
										<a
											href="https://jumper.exchange/?toChain=8453&toToken=0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full"
										>
											<CustomListItem
												label={dictionary.pages.wallet.modals.trade.base_jumper}
												startAdornment={
													<Image
														src="/icons/exchanges/jumper.svg"
														alt="Jumper"
														width={24}
														height={24}
														className="size-6 rounded-full"
														priority
													/>
												}
												endAdornment={
													<PiArrowSquareOut className="size-4 text-gray-400" />
												}
											/>
										</a>
										<a
											href="https://app.uniswap.org/explore/tokens/base/0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full"
										>
											<CustomListItem
												label={
													dictionary.pages.wallet.modals.trade.base_uniswap
												}
												startAdornment={
													<Image
														src="/icons/exchanges/uniswap.svg"
														alt="Uniswap"
														width={24}
														height={24}
														className="size-6 rounded-full"
														priority
													/>
												}
												endAdornment={
													<PiArrowSquareOut className="size-4 text-gray-400" />
												}
											/>
										</a>
										<a
											href="https://jumper.exchange/?toChain=480&toToken=0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full"
										>
											<CustomListItem
												label={
													dictionary.pages.wallet.modals.trade.worldchain_jumper
												}
												startAdornment={
													<Image
														src="/icons/exchanges/jumper.svg"
														alt="Jumper"
														width={24}
														height={24}
														className="size-6 rounded-full"
														priority
													/>
												}
												endAdornment={
													<PiArrowSquareOut className="size-4 text-gray-400" />
												}
											/>
										</a>
										<a
											href="https://app.uniswap.org/explore/tokens/worldchain/0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full"
										>
											<CustomListItem
												label={
													dictionary.pages.wallet.modals.trade
														.worldchain_uniswap
												}
												startAdornment={
													<Image
														src="/icons/exchanges/uniswap.svg"
														alt="Uniswap"
														width={24}
														height={24}
														className="size-6 rounded-full"
														priority
													/>
												}
												endAdornment={
													<PiArrowSquareOut className="size-4 text-gray-400" />
												}
											/>
										</a>
									</div>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>

				<AccountVerificationSection
					dictionary={dictionary}
					authenticated={authenticated}
					userId={profileData?.userUuid ?? null}
					isSelfVerified={isSelfVerified}
					onRequireAuth={() => setShowSignInDialog(true)}
					onSuccess={async () => {
						const fresh = await getWalletAuthAndData();
						setServerData(fresh);
						setCachedWalletData(fresh);
						router.refresh();
					}}
				/>

				<div>
					<div className="mb-4 flex">
						<Typography variant="subtitle" level={3} className="text-gray-400">
							{dictionary.pages.wallet.history.title}
						</Typography>
					</div>
					<TransactionHistoryContent
						transactions={authenticated ? transactions : []}
						streams={authenticated ? userStreams : null}
						streamRatesById={authenticated ? data?.streamRatesById : null}
						dictionary={dictionary}
						lang={params.lang}
					/>
				</div>
			</div>

			{/* Sign-in dialog */}
			<SignInDialog
				open={showSignInDialog}
				onOpenChange={setShowSignInDialog}
				dictionary={dictionary}
			/>
		</div>
	);
}
