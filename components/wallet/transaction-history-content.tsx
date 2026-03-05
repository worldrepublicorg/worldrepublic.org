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
import { useEffect, useState } from "react";
import {
  PiArrowCircleDownFill,
  PiArrowCircleUpFill,
  PiCaretDown,
  PiClock,
  PiCopy,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { getTransactions } from "@/lib/actions/member";
import { cn, copyToClipboard } from "@/lib/utils";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  walletAddress?: string;
  selectedChain?: string;
  recipientUserId?: string;
  streamType?: string;
  createdAt: number;
  isReceived: boolean;
}

interface TransactionHistoryContentProps {
  transactions?: Transaction[] | null;
  dictionary: Dictionary;
  lang: string;
}

export function TransactionHistoryContent({
  transactions: transactionsProp,
  dictionary,
  lang,
}: TransactionHistoryContentProps) {
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>(
    transactionsProp || [],
  );
  const [isLoading, setIsLoading] = useState(transactionsProp === undefined);
  const [error, setError] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [, setTick] = useState(0);

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
    }
  }, [transactionsProp]);

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

        const result = await getTransactions(100);
        if (result.success) {
          setTransactions(result.transactions || []);
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
        toast.error({
          title: dictionary.pages.wallet.transactions.failed_to_load,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionsProp]); // Only fetch if transactions prop is not provided

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

  // Format amount (display 6 decimals, but stored with 18 decimals precision)
  const formatAmount = (amount: number): string => {
    // If amount is effectively zero (stored as 0.000000...), show <0.000001
    const absAmount = Math.abs(amount);
    if (absAmount < 0.000001) {
      return "<0.000001";
    }
    return absAmount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getTransactionLabel = (transaction: Transaction): string => {
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

  const getAmountDisplay = (transaction: Transaction): string => {
    const isZero = Math.abs(transaction.amount) < 0.000001;
    const amount = formatAmount(transaction.amount);

    const isStream =
      transaction.type === "STREAM_CREATED" ||
      transaction.type === "STREAM_UPDATED";
    if (isStream) {
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
    return `-${amount}`;
  };

  const getAmountColor = (transaction: Transaction): string => {
    if (transaction.type === "TRANSFER" && transaction.isReceived) {
      return "text-green-600";
    }
    if (
      transaction.type === "STREAM_CREATED" ||
      transaction.type === "STREAM_UPDATED"
    ) {
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
      transaction.type === "STREAM_UPDATED"
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
    if (selectedChain === "8453") return "Base";
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

  const hasStreamTx = transactions.some(
    (tx) => tx.type === "STREAM_CREATED" || tx.type === "STREAM_UPDATED",
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
    if (type === "WITHDRAWAL") {
      return dictionary.pages.wallet.transactions.types.withdrawal;
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
  if (hasStreamTx) {
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
      (tx) => tx.type === "STREAM_CREATED" || tx.type === "STREAM_UPDATED",
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
              return (
                <div key={transaction.id} className="flex items-center gap-4">
                  {/* Transaction icon */}
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    {transaction.type === "WITHDRAWAL" &&
                    getChainLogoPath(transaction.selectedChain) ? (
                      <Image
                        src={getChainLogoPath(transaction.selectedChain)!}
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
                    <div className="flex flex-row-reverse flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <Typography
                          variant="body"
                          level={3}
                          className="font-medium text-gray-900"
                        >
                          {getTransactionLabel(transaction)}
                        </Typography>
                        {/* Details + Date (one line: withdrawal info or stream event, then date) */}
                        {(() => {
                          const hasWithdrawalDetails =
                            transaction.walletAddress ||
                            transaction.recipientUserId;
                          const hasDetailsBeforeDate =
                            transaction.walletAddress ||
                            transaction.selectedChain ||
                            streamEventLabel;
                          return (
                            <div className="flex flex-wrap items-center gap-x-0 text-xs text-gray-500 mt-1">
                              {transaction.walletAddress && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleCopyWalletAddress(
                                        transaction.walletAddress!,
                                      )
                                    }
                                    className="flex items-center gap-1 hover:text-gray-700"
                                  >
                                    <span className="line-clamp-1">
                                      {`${transaction.walletAddress.slice(0, 6)}...${transaction.walletAddress.slice(-4)}`}
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
                                  {getChainDisplayName(
                                    transaction.selectedChain,
                                  )}
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
                          );
                        })()}
                      </div>
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
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}
