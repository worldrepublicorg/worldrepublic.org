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
import { LearnMoreDrawer } from "@/components/learn-more-drawer";
import { useSavings } from "@/hooks/use-savings";
import { cn, formatFullAmount, getRewardDecimals } from "@/lib/utils";

interface SavingsSectionProps {
  dictionary: Dictionary;
  isAuthenticated: boolean;
  walletBalance: number;
  savingsBalance: number;
  unclaimedSavingsInterest: number;
  savingsLastUpdatedAt: number | null;
  onSuccess: () => Promise<void> | void;
}

export function SavingsSection({
  dictionary,
  isAuthenticated,
  walletBalance,
  savingsBalance,
  unclaimedSavingsInterest,
  savingsLastUpdatedAt,
  onSuccess,
}: SavingsSectionProps) {
  const [selectedAction, setSelectedAction] = useState<"deposit" | "withdraw">(
    "deposit",
  );
  const [isLearnMoreDrawerOpen, setIsLearnMoreDrawerOpen] = useState(false);
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
    walletBalance,
    onSuccess,
  );

  const maxButtonAmount = useMemo(() => {
    const source = selectedAction === "deposit" ? walletBalance : savingsBalance;
    const safeAmount = Math.max(0, source - 1e-12);
    return formatFullAmount(safeAmount);
  }, [selectedAction, walletBalance, savingsBalance]);
  const rewardDecimals = getRewardDecimals(savingsBalance);

  const hasInsufficientBalance = () => {
    if (!amount || Number(amount) <= 0) return false;
    const entered = Number(amount);
    const source = selectedAction === "deposit" ? walletBalance : savingsBalance;
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
                onClick={() => setIsLearnMoreDrawerOpen(true)}
                className="inline-flex shrink-0 items-center justify-center text-gray-400"
                aria-label={dictionary.pages.govern.parties.learn_more}
              >
                <PiInfoFill className="ml-1 size-4 translate-y-[2px]!" />
              </button>
            </span>
          </Typography>
          <LearnMoreDrawer
            open={isLearnMoreDrawerOpen}
            onOpenChange={setIsLearnMoreDrawerOpen}
            title={dictionary.pages.govern.parties.learn_more}
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
                {(Math.floor(savingsBalance * 10000) / 10000).toFixed(4)} WDD
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                    className="mr-2 h-9 min-w-20 rounded-full px-4 font-sans"
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
                      maxCollectableAmount.toFixed(rewardDecimals),
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
              <Typography variant="number" level={5} className="font-['Rubik'] text-base">
                {maxCollectableAmount.toFixed(rewardDecimals)}
              </Typography>
            </div>
          </div>

          {selectedAction === "deposit" ? (
            <AlertDialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button disabled={isActionDisabled} fullWidth>
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
                    amount || "0",
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
                <Button disabled={isActionDisabled} fullWidth>
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
                    amount || "0",
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
