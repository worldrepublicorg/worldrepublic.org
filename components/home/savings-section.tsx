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
} from "@worldcoin/mini-apps-ui-kit-react";
import { useMemo, useState } from "react";
import {
  PiCoinsFill,
  PiHandArrowDownFill,
  PiHandArrowUpFill,
  PiInfoFill,
  PiPiggyBankFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LearnMoreDialog } from "@/components/learn-more-dialog";
import { useSavings } from "@/hooks/use-savings";
import { getSafeLocale } from "@/lib/locale";
import { cn, formatFullAmount, getRewardDecimals } from "@/lib/utils";

interface SavingsSectionProps {
  lang: string;
  dictionary: Dictionary;
  isActive?: boolean;
  isAuthenticated: boolean;
  walletBalance: number;
  savingsBalance: number;
  unclaimedSavingsInterest: number;
  basicIncomeClaimedTotal: number;
  isSelfVerified: boolean;
  savingsLastUpdatedAt: number | null;
  onSuccess: () => Promise<void> | void;
}

export function SavingsSection({
  lang,
  dictionary,
  isActive = true,
  isAuthenticated,
  walletBalance,
  savingsBalance,
  unclaimedSavingsInterest,
  basicIncomeClaimedTotal,
  isSelfVerified,
  savingsLastUpdatedAt,
  onSuccess,
}: SavingsSectionProps) {
  const raisedButtonShadowClass =
    "shadow-[0_4px_10px_rgba(0,0,0,0.19)]! disabled:shadow-none! transition-[color,background-color,border-color,text-decoration-color,fill,stroke,box-shadow]!";
  const [selectedAction, setSelectedAction] = useState<"deposit" | "withdraw">(
    "deposit",
  );
  const [isLearnMoreDialogOpen, setIsLearnMoreDialogOpen] = useState(false);
  const [collectDialogOpen, setCollectDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const {
    amount,
    setAmount,
    isSavingsLoading,
    maxCollectableAmount,
    handleDeposit,
    handleWithdraw,
    handleCollectInterest,
  } = useSavings(
    dictionary,
    savingsBalance,
    unclaimedSavingsInterest,
    savingsLastUpdatedAt,
    basicIncomeClaimedTotal,
    isSelfVerified,
    isActive,
    onSuccess,
  );

  const maxButtonAmount = useMemo(() => {
    const source =
      selectedAction === "deposit" ? walletBalance : savingsBalance;
    const safeAmount = Math.max(0, source - 1e-12);
    return formatFullAmount(safeAmount);
  }, [selectedAction, walletBalance, savingsBalance]);
  const rewardDecimals = getRewardDecimals(savingsBalance);
  const locale = getSafeLocale(lang);
  const savingsBalanceDisplay = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(Math.floor(savingsBalance * 10000) / 10000);
  const collectableAmountDisplay = new Intl.NumberFormat(locale, {
    minimumFractionDigits: rewardDecimals,
    maximumFractionDigits: rewardDecimals,
  }).format(maxCollectableAmount);
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
      selectedAction === "deposit" ? walletBalance : savingsBalance;
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
    isSavingsLoading ||
    !isAuthenticated ||
    !amount ||
    Number(amount) <= 0 ||
    hasInsufficientBalance();

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
                <PiInfoFill className="ml-1 size-4 translate-y-[2px]!" />
              </button>
            </span>
          </Typography>
          <LearnMoreDialog
            open={isLearnMoreDialogOpen}
            onOpenChange={setIsLearnMoreDialogOpen}
            title={dictionary.pages.earn.savings.title}
            info={dictionary.pages.earn.savings.tooltip}
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
              <AlertDialog
                open={collectDialogOpen}
                onOpenChange={setCollectDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={
                      !isAuthenticated ||
                      isSavingsLoading ||
                      maxCollectableAmount <= 0
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
                          await handleCollectInterest();
                          setCollectDialogOpen(false);
                        }}
                        disabled={isSavingsLoading}
                        fullWidth
                      >
                        {dictionary.common.confirm}
                      </Button>
                    </AlertDialogClose>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Typography
                variant="number"
                level={5}
                className="font-['Rubik'] text-base"
              >
                {collectableAmountDisplay}
              </Typography>
            </div>
          </div>

          {selectedAction === "deposit" ? (
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
                        await handleDeposit();
                        setDepositDialogOpen(false);
                      }}
                      disabled={isSavingsLoading}
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
                        await handleWithdraw();
                        setWithdrawDialogOpen(false);
                      }}
                      disabled={isSavingsLoading}
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
    </div>
  );
}
