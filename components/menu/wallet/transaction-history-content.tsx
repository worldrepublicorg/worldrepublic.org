"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	PiArrowCircleDownFill,
	PiArrowCircleUpFill,
	PiCaretDown,
	PiClock,
	PiCopy,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { getTransactions } from "@/lib/actions/member";
import type { StreamData } from "@/lib/streams";
import { cn, copyToClipboard } from "@/lib/utils";

interface Transaction {
	id: number;
	type: string;
	amount: number;
	walletAddress?: string;
	selectedChain?: string;
	recipientUserId?: string;
	streamType?: string;
	streamId?: string;
	createdAt: number;
	isReceived: boolean;
}

interface TransactionHistoryContentProps {
	transactions?: Transaction[] | null;
	streams?: StreamData[] | null;
	streamRatesById?: Record<string, number> | null;
	dictionary: Dictionary;
	lang: string;
}

const TRANSACTIONS_PAGE_SIZE = 100;

export function TransactionHistoryContent({
	transactions: transactionsProp,
	streams = null,
	streamRatesById = null,
	dictionary,
	lang,
}: TransactionHistoryContentProps) {
	const { toast } = useToast();
	const toastRef = useRef(toast);
	toastRef.current = toast;

	const [transactions, setTransactions] = useState<Transaction[]>(
		transactionsProp || [],
	);
	const [isLoading, setIsLoading] = useState(transactionsProp === undefined);
	const [error, setError] = useState("");
	const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
	const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreTransactions, setHasMoreTransactions] = useState(
		(transactionsProp?.length || 0) >= TRANSACTIONS_PAGE_SIZE,
	);
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [, setTick] = useState(0);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	// Update periodically to refresh relative time displays
	// This triggers re-renders so formatDate() recalculates with current time
	useEffect(() => {
		// Update every minute to match the granularity of "Xm ago" display
		const interval = setInterval(() => {
			setTick((prev) => prev + 1); // Trigger re-render
		}, 60000); // Update every 60 seconds (1 minute)

		return () => clearInterval(interval);
	}, []);

	// Update transactions when transactions prop changes
	useEffect(() => {
		if (transactionsProp !== undefined) {
			setTransactions(transactionsProp || []);
			setIsLoading(false);
			setError("");
			setHasMoreTransactions(
				(transactionsProp?.length || 0) >= TRANSACTIONS_PAGE_SIZE,
			);
		}
	}, [transactionsProp]);

	const loadMoreTransactions = useCallback(async () => {
		if (isLoadingMore || !hasMoreTransactions) return;

		setIsLoadingMore(true);
		try {
			const result = await getTransactions(
				TRANSACTIONS_PAGE_SIZE,
				transactions.length,
			);
			if (result.success) {
				const next = result.transactions || [];
				if (next.length === 0) {
					setHasMoreTransactions(false);
				} else {
					setTransactions((prev) => [...prev, ...next]);
					setHasMoreTransactions(Boolean(result.hasMore));
				}
			} else {
				setHasMoreTransactions(false);
			}
		} catch {
			setHasMoreTransactions(false);
		} finally {
			setIsLoadingMore(false);
		}
	}, [isLoadingMore, hasMoreTransactions, transactions.length]);

	// Fetch transactions only if not provided as prop
	useEffect(() => {
		if (transactionsProp !== undefined) {
			// Transactions were provided, no need to fetch
			return;
		}

		const fetchTransactions = async () => {
			try {
				setIsLoading(true);
				setError("");

				const result = await getTransactions(TRANSACTIONS_PAGE_SIZE, 0);
				if (result.success) {
					setTransactions(result.transactions || []);
					setHasMoreTransactions(Boolean(result.hasMore));
				} else {
					throw new Error(
						result.error || dictionary.pages.wallet.transactions.failed_to_load,
					);
				}
			} catch (error) {
				console.error(
					"[TransactionHistoryContent] Error fetching data:",
					error,
				);
				const errorMessage =
					error instanceof Error
						? error.message
						: dictionary.pages.wallet.transactions.failed_to_load;
				setError(errorMessage);
				toastRef.current.error({
					title: dictionary.pages.wallet.transactions.failed_to_load,
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchTransactions();
	}, [transactionsProp, dictionary.pages.wallet.transactions.failed_to_load]); // Only fetch if transactions prop is not provided

	// Infinite scroll setup for transaction history
	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !isLoadingMore && hasMoreTransactions) {
					void loadMoreTransactions();
				}
			},
			{ threshold: 0.1 },
		);

		if (loadMoreRef.current) {
			observerRef.current.observe(loadMoreRef.current);
		}

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [isLoadingMore, hasMoreTransactions, loadMoreTransactions]);

	// Scroll to top button behavior
	useEffect(() => {
		const handleScroll = () => {
			setShowScrollToTop(window.scrollY > 300);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth",
		});
	};

	const locale = lang.trim() || "en";

	// Format date
	const formatDate = (timestamp: number): string => {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();

		// Handle edge case where date might be in the future
		if (diffMs < 0) {
			return dictionary.pages.wallet.transactions.just_now;
		}

		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return dictionary.pages.wallet.transactions.just_now;
		if (diffMins < 60)
			return dictionary.pages.wallet.transactions.minutes_ago.replace(
				"{minutes}",
				String(diffMins),
			);
		if (diffHours < 24)
			return dictionary.pages.wallet.transactions.hours_ago.replace(
				"{hours}",
				String(diffHours),
			);
		if (diffDays < 7)
			return dictionary.pages.wallet.transactions.days_ago.replace(
				"{days}",
				String(diffDays),
			);

		const currentDate = new Date();
		return date.toLocaleDateString(locale, {
			month: "short",
			day: "numeric",
			year:
				date.getFullYear() !== currentDate.getFullYear()
					? "numeric"
					: undefined,
		});
	};

	// Format amount with transaction-type specific precision.
	const formatAmount = (amount: number, transaction: Transaction): string => {
		// If amount is effectively zero (stored as 0.000000...), show <0.000001
		const absAmount = Math.abs(amount);
		if (absAmount < 0.000001) {
			return "<0.000001";
		}

		const usesDynamicPrecision =
			transaction.type === "BASIC_INCOME_CLAIM" ||
			transaction.type === "SAVINGS_DEPOSIT" ||
			transaction.type === "SAVINGS_WITHDRAWAL" ||
			transaction.type === "SAVINGS_INTEREST_CLAIM";

		const getSavingsTxPrecision = (txAmount: number): number => {
			if (txAmount >= 100) return 2;
			if (txAmount >= 10) return 3;
			if (txAmount >= 1) return 4;
			if (txAmount >= 0.1) return 5;
			return 6;
		};

		const precision = usesDynamicPrecision
			? getSavingsTxPrecision(absAmount)
			: 2;

		return absAmount.toLocaleString(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: precision,
		});
	};

	const getTransactionLabel = (transaction: Transaction): string => {
		if (transaction.type === "BASIC_INCOME_CLAIM") {
			return dictionary.pages.earn.tabs.basic_income;
		}
		if (transaction.type === "SAVINGS_DEPOSIT") {
			return dictionary.pages.wallet.transactions.types.savings_deposit;
		}
		if (transaction.type === "SAVINGS_WITHDRAWAL") {
			return dictionary.pages.wallet.transactions.types.savings_withdrawal;
		}
		if (transaction.type === "SAVINGS_INTEREST_CLAIM") {
			return dictionary.pages.wallet.transactions.types.savings_interest;
		}
		if (transaction.type === "WITHDRAWAL") {
			return dictionary.pages.wallet.transactions.types.withdrawal;
		}
		if (transaction.type === "TRANSFER") {
			return transaction.isReceived
				? dictionary.pages.wallet.transactions.types.received
				: dictionary.pages.wallet.transactions.types.sent;
		}
		if (transaction.type === "STREAM_CREATED") {
			return transaction.streamType === "AMBASSADOR"
				? dictionary.pages.wallet.transactions.types.ambassador_reward
				: dictionary.pages.wallet.transactions.types.party_subsidy;
		}
		if (transaction.type === "STREAM_UPDATED") {
			return transaction.streamType === "AMBASSADOR"
				? dictionary.pages.wallet.transactions.types.ambassador_reward
				: dictionary.pages.wallet.transactions.types.party_subsidy;
		}
		if (transaction.type === "REFERRAL_VERIFIED_BONUS") {
			return dictionary.pages.wallet.transactions.types.referral_reward;
		}
		return transaction.type;
	};

	const getStreamEventLabel = (transaction: Transaction): string | null => {
		if (transaction.type === "STREAM_CREATED") {
			return dictionary.pages.wallet.transactions.types.stream_created;
		}
		if (transaction.type === "STREAM_UPDATED") {
			return dictionary.pages.wallet.transactions.types.stream_updated;
		}
		return null;
	};

	// WDD/day for stream transactions (when streams are provided and tx has streamId)
	const getStreamRatePerDayFormatted = (
		transaction: Transaction,
	): string | null => {
		if (
			!transaction.streamId ||
			(transaction.type !== "STREAM_CREATED" &&
				transaction.type !== "STREAM_UPDATED")
		) {
			return null;
		}
		const ratePerSecondFromHistory = streamRatesById?.[transaction.streamId];
		const ratePerSecond =
			ratePerSecondFromHistory ??
			streams?.find((s) => s.id === transaction.streamId)?.ratePerSecond;
		if (ratePerSecond == null) return null;
		const ratePerDay = ratePerSecond * 86400;
		if (ratePerDay < 0.000001) return "<0.000001";
		return ratePerDay.toLocaleString(locale, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	const isPositiveTransaction = (transaction: Transaction): boolean => {
		if (transaction.type === "TRANSFER" && transaction.isReceived) {
			return true;
		}
		if (transaction.type === "BASIC_INCOME_CLAIM") {
			return true;
		}
		if (
			transaction.type === "SAVINGS_WITHDRAWAL" ||
			transaction.type === "SAVINGS_INTEREST_CLAIM"
		) {
			return true;
		}
		if (
			transaction.type === "STREAM_CREATED" ||
			transaction.type === "STREAM_UPDATED" ||
			transaction.type === "REFERRAL_VERIFIED_BONUS" ||
			transaction.type === "ADMIN_STREAM_REPAIR"
		) {
			return true;
		}
		return false;
	};

	const getAmountDisplay = (transaction: Transaction): string => {
		const isZero = Math.abs(transaction.amount) < 0.000001;
		const amount = formatAmount(transaction.amount, transaction);

		const isStream =
			transaction.type === "STREAM_CREATED" ||
			transaction.type === "STREAM_UPDATED";
		if (isStream) {
			return isZero ? "+<0.000001" : `+${amount}`;
		}

		if (transaction.type === "REFERRAL_VERIFIED_BONUS") {
			return isZero ? "+<0.000001" : `+${amount}`;
		}

		if (isZero) {
			if (
				transaction.type === "WITHDRAWAL" ||
				(transaction.type === "TRANSFER" && !transaction.isReceived)
			) {
				return "-<0.000001";
			}
			return "+<0.000001";
		}

		if (transaction.type === "TRANSFER" && transaction.isReceived) {
			return `+${amount}`;
		}
		if (
			transaction.type === "WITHDRAWAL" ||
			(transaction.type === "TRANSFER" && !transaction.isReceived)
		) {
			return `-${amount}`;
		}
		return isPositiveTransaction(transaction) ? `+${amount}` : `-${amount}`;
	};

	const getAmountColor = (transaction: Transaction): string => {
		if (isPositiveTransaction(transaction)) {
			return "text-green-600";
		}
		return "text-gray-900";
	};

	// Copy wallet address to clipboard
	const handleCopyWalletAddress = async (address: string) => {
		await copyToClipboard(address, toast, {
			success: dictionary.toasts.copied,
			error: dictionary.toasts.generic_error,
		});
	};

	const getTransactionIcon = (transaction: Transaction) => {
		if (transaction.type === "BASIC_INCOME_CLAIM") {
			return PiArrowCircleDownFill;
		}
		if (transaction.type === "SAVINGS_DEPOSIT") {
			return PiArrowCircleUpFill;
		}
		if (
			transaction.type === "SAVINGS_WITHDRAWAL" ||
			transaction.type === "SAVINGS_INTEREST_CLAIM"
		) {
			return PiArrowCircleDownFill;
		}
		if (transaction.type === "WITHDRAWAL") {
			return PiArrowCircleUpFill;
		}
		if (transaction.type === "TRANSFER") {
			return transaction.isReceived
				? PiArrowCircleDownFill
				: PiArrowCircleUpFill;
		}
		if (
			transaction.type === "STREAM_CREATED" ||
			transaction.type === "STREAM_UPDATED" ||
			transaction.type === "REFERRAL_VERIFIED_BONUS" ||
			transaction.type === "ADMIN_STREAM_REPAIR"
		) {
			return PiArrowCircleDownFill;
		}
		return PiClock;
	};

	// Get chain logo path
	const getChainLogoPath = (selectedChain?: string): string | null => {
		if (selectedChain === "1") {
			return "/icons/chains/ethereum.svg";
		}
		if (selectedChain === "480") {
			return "/icons/chains/world.svg";
		}
		return null;
	};

	const getChainDisplayName = (selectedChain?: string): string => {
		if (selectedChain === "1") return "Ethereum";
		if (selectedChain === "143") return "Monad";
		if (selectedChain === "480") return "World Chain";
		if (selectedChain === "8453") return "Base Chain";
		return selectedChain || "";
	};

	// Get unique transaction types from transactions
	// For TRANSFER, we need to show both "Received" and "Sent" as separate options
	const options: Array<{ value: string; label: string }> = [];
	const types = new Set<string>();
	const hasReceivedTransfer = transactions.some(
		(tx) => tx.type === "TRANSFER" && tx.isReceived,
	);
	const hasSentTransfer = transactions.some(
		(tx) => tx.type === "TRANSFER" && !tx.isReceived,
	);

	const hasRewardTx = transactions.some(
		(tx) =>
			tx.type === "STREAM_CREATED" ||
			tx.type === "STREAM_UPDATED" ||
			tx.type === "REFERRAL_VERIFIED_BONUS",
	);

	transactions.forEach((tx) => {
		if (
			tx.type !== "TRANSFER" &&
			tx.type !== "STREAM_CREATED" &&
			tx.type !== "STREAM_UPDATED"
		) {
			types.add(tx.type);
		}
	});

	const getTypeLabel = (type: string): string => {
		if (type === "SAVINGS_DEPOSIT") {
			return dictionary.pages.wallet.transactions.types.savings_deposit;
		}
		if (type === "SAVINGS_WITHDRAWAL") {
			return dictionary.pages.wallet.transactions.types.savings_withdrawal;
		}
		if (type === "SAVINGS_INTEREST_CLAIM") {
			return dictionary.pages.wallet.transactions.types.savings_interest;
		}
		if (type === "BASIC_INCOME_CLAIM") {
			return dictionary.pages.earn.tabs.basic_income;
		}
		if (type === "WITHDRAWAL") {
			return dictionary.pages.wallet.transactions.types.withdrawal;
		}
		if (type === "REFERRAL_VERIFIED_BONUS") {
			return dictionary.pages.wallet.transactions.types.referral_reward;
		}
		return type;
	};

	Array.from(types)
		.sort()
		.forEach((type) => {
			options.push({
				value: type,
				label: getTypeLabel(type),
			});
		});

	if (hasReceivedTransfer) {
		options.push({
			value: "TRANSFER_RECEIVED",
			label: dictionary.pages.wallet.transactions.types.received,
		});
	}
	if (hasSentTransfer) {
		options.push({
			value: "TRANSFER_SENT",
			label: dictionary.pages.wallet.transactions.types.sent,
		});
	}
	if (hasRewardTx) {
		options.push({
			value: "REWARDS",
			label: dictionary.pages.wallet.transactions.filter.rewards,
		});
	}

	const availableFilterOptions = options;

	let filteredTransactions = transactions;
	if (selectedFilter === "TRANSFER_RECEIVED") {
		filteredTransactions = transactions.filter(
			(tx) => tx.type === "TRANSFER" && tx.isReceived,
		);
	} else if (selectedFilter === "TRANSFER_SENT") {
		filteredTransactions = transactions.filter(
			(tx) => tx.type === "TRANSFER" && !tx.isReceived,
		);
	} else if (selectedFilter === "REWARDS") {
		filteredTransactions = transactions.filter(
			(tx) =>
				tx.type === "STREAM_CREATED" ||
				tx.type === "STREAM_UPDATED" ||
				tx.type === "REFERRAL_VERIFIED_BONUS",
		);
	} else if (selectedFilter !== "ALL") {
		filteredTransactions = transactions.filter(
			(tx) => tx.type === selectedFilter,
		);
	}

	// Get filter label for display
	const getFilterLabel = (filterValue: string): string => {
		if (filterValue === "ALL") {
			return dictionary.pages.wallet.transactions.filter.all_types;
		}
		const option = availableFilterOptions.find(
			(opt) => opt.value === filterValue,
		);
		return option ? option.label : filterValue;
	};

	// Handle filter selection
	const handleFilterSelect = (filterValue: string) => {
		setSelectedFilter(filterValue);
		setIsFilterDialogOpen(false);
	};

	return (
		<div className="flex flex-1 flex-col">
			{isLoading ? (
				// Loading state
				<div className="flex flex-1 flex-col">
					{/* Filter button - show actual text and icon */}
					<button
						type="button"
						onClick={() => setIsFilterDialogOpen(true)}
						className="mb-8! flex items-center gap-1 self-start"
						disabled
					>
						<Typography
							variant="body"
							level={3}
							className="font-medium text-gray-900"
						>
							{dictionary.pages.wallet.transactions.filter.all_types}
						</Typography>
						<PiCaretDown className="size-4 text-gray-500" />
					</button>

					<div className="mb-6 space-y-8">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
							<div key={i} className="flex items-center gap-4">
								{/* Icon skeleton */}
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
									<div className="size-4.5 animate-pulse rounded-full bg-gray-200"></div>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-1">
										<div className="h-[20px] w-24 animate-pulse rounded bg-gray-100"></div>
										<div className="h-[17px] w-30 animate-pulse rounded bg-gray-100"></div>
									</div>
									<div className="mt-1 h-4 w-10 animate-pulse rounded bg-gray-100"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			) : error ? (
				// Error state
				<div className="mt-4 mb-8 text-center text-sm text-gray-500">
					{dictionary.pages.wallet.transactions.failed_to_load}
				</div>
			) : transactions.length === 0 ? (
				// Empty state
				<div className="flex flex-1 flex-col">
					{/* Filter button - show even when empty for consistency with skeleton */}
					<button
						type="button"
						onClick={() => setIsFilterDialogOpen(true)}
						className="mb-8! flex items-center gap-1 self-start"
					>
						<Typography
							variant="body"
							level={3}
							className="font-medium text-gray-900"
						>
							{getFilterLabel(selectedFilter)}
						</Typography>
						<PiCaretDown className="size-4 text-gray-500" />
					</button>

					<div className="mt-4 mb-8 text-center text-sm text-gray-500">
						{dictionary.pages.wallet.transactions.no_transactions}
					</div>
				</div>
			) : (
				// Transactions list
				<div className="flex flex-1 flex-col">
					{/* Filter button */}
					<button
						type="button"
						onClick={() => setIsFilterDialogOpen(true)}
						className="mb-8! flex items-center gap-1 self-start"
					>
						<Typography
							variant="body"
							level={3}
							className="font-medium text-gray-900"
						>
							{getFilterLabel(selectedFilter)}
						</Typography>
						<PiCaretDown className="size-4 text-gray-500" />
					</button>

					<div className="mb-6 space-y-8">
						{filteredTransactions.map((transaction) => {
							const IconComponent = getTransactionIcon(transaction);
							const streamEventLabel = getStreamEventLabel(transaction);
							const chainLogoPath = getChainLogoPath(transaction.selectedChain);
							return (
								<div key={transaction.id} className="flex items-center gap-4">
									{/* Transaction icon */}
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
										{transaction.type === "WITHDRAWAL" && chainLogoPath ? (
											<Image
												src={chainLogoPath}
												alt={getChainDisplayName(transaction.selectedChain)}
												width={30}
												height={30}
												className="rounded-full"
											/>
										) : (
											<IconComponent className="size-4.5 text-gray-400" />
										)}
									</div>
									{/* Transaction details */}
									<div className="flex-1 min-w-0">
										<div className="flex items-center justify-between gap-2">
											<Typography
												variant="body"
												level={3}
												className="font-medium text-gray-900"
											>
												{getTransactionLabel(transaction)}
											</Typography>
											<Typography
												variant="body"
												level={3}
												className={cn(
													"shrink-0 whitespace-nowrap font-mono font-medium",
													getAmountColor(transaction),
												)}
											>
												{getAmountDisplay(transaction)} WDD
											</Typography>
										</div>
										{/* Details + Date (one line: withdrawal info or stream event, then date; stream rows add WDD/day on the right) */}
										{(() => {
											const walletAddress = transaction.walletAddress;
											const hasWithdrawalDetails =
												walletAddress || transaction.recipientUserId;
											const hasDetailsBeforeDate =
												walletAddress ||
												transaction.selectedChain ||
												streamEventLabel;
											const streamRateFormatted =
												getStreamRatePerDayFormatted(transaction);
											return (
												<div className="flex items-center justify-between gap-2 text-[12px] text-gray-500 mt-0.5">
													<div className="flex flex-wrap items-center gap-x-0 min-w-0">
														{walletAddress && (
															<>
																<button
																	type="button"
																	onClick={() =>
																		handleCopyWalletAddress(walletAddress)
																	}
																	className="flex items-center gap-1"
																>
																	<span className="line-clamp-1">
																		{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
																	</span>
																	<PiCopy className="h-3 w-3" />
																</button>
																{transaction.selectedChain && (
																	<span className="mx-1">·</span>
																)}
															</>
														)}
														{transaction.selectedChain && (
															<span>
																{getChainDisplayName(transaction.selectedChain)}
															</span>
														)}
														{!hasWithdrawalDetails && streamEventLabel && (
															<>
																<span>{streamEventLabel}</span>
																<span className="mx-1">·</span>
															</>
														)}
														{hasWithdrawalDetails && hasDetailsBeforeDate && (
															<span className="mx-1">·</span>
														)}
														<span>{formatDate(transaction.createdAt)}</span>
													</div>
													{streamRateFormatted != null && (
														<span className="shrink-0">
															({streamRateFormatted}{" "}
															{dictionary.pages.wallet.transactions.wdd_per_day}
															)
														</span>
													)}
												</div>
											);
										})()}
									</div>
								</div>
							);
						})}
						{hasMoreTransactions && (
							<div ref={loadMoreRef} className="h-14 py-4" />
						)}
					</div>
				</div>
			)}

			{/* Filter Dialog */}
			<AlertDialog
				open={isFilterDialogOpen}
				onOpenChange={setIsFilterDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<Typography variant="heading" level={3}>
							{dictionary.pages.wallet.transactions.filter.select_type}
						</Typography>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<div className="flex flex-col gap-2">
							{/* All types option */}
							<div
								className={cn(
									"rounded-2xl",
									selectedFilter === "ALL" && "border-2",
								)}
							>
								<CustomListItem
									label={dictionary.pages.wallet.transactions.filter.all_types}
									onClick={() => handleFilterSelect("ALL")}
									noPointer={false}
								/>
							</div>

							{/* Transaction type options */}
							{availableFilterOptions.map((option) => (
								<div
									key={option.value}
									className={cn(
										"rounded-2xl",
										selectedFilter === option.value && "border-2",
									)}
								>
									<CustomListItem
										label={option.label}
										onClick={() => handleFilterSelect(option.value)}
										noPointer={false}
									/>
								</div>
							))}
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<ScrollToTopButton show={showScrollToTop} onClick={scrollToTop} />
		</div>
	);
}
