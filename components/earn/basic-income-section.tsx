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
import { PiHandCoinsFill, PiInfoFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { LearnMoreDrawer } from "@/components/learn-more-drawer";
import { useBasicIncome } from "@/hooks/use-basic-income";

interface BasicIncomeSectionProps {
  dictionary: Dictionary;
  isAuthenticated: boolean;
  basicIncomeActivatedAt: number | null;
  lastBasicIncomeClaimAt: number | null;
  basicIncomeClaimedTotal: number | null;
  onSignIn: () => void;
  onSuccess: () => void;
}

export function BasicIncomeSection({
  dictionary,
  isAuthenticated,
  basicIncomeActivatedAt,
  lastBasicIncomeClaimAt,
  basicIncomeClaimedTotal,
  onSignIn,
  onSuccess,
}: BasicIncomeSectionProps) {
  const [isLearnMoreDrawerOpen, setIsLearnMoreDrawerOpen] = useState(false);

  const {
    isActivating,
    isClaiming,
    maxClaimableAmount,
    handleActivate,
    handleClaim,
  } = useBasicIncome(
    basicIncomeActivatedAt,
    lastBasicIncomeClaimAt,
    basicIncomeClaimedTotal,
    onSuccess,
  );

  const amountString = maxClaimableAmount.toFixed(6);

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
            <Typography
              variant="subtitle"
              level={2}
              className="text-gray-500"
            >
              {dictionary.pages.earn.basic_income.subtitle_unauth}
            </Typography>
            <div className="mt-6 w-full">
              <Button
                fullWidth
                className="shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
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
            <Typography
              variant="subtitle"
              level={2}
              className="text-gray-500"
            >
              {dictionary.pages.earn.basic_income.setup_subtitle}
            </Typography>
            <Button
              fullWidth
              className="mt-6! shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
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
          <Typography
            variant="subtitle"
            level={2}
            className="mx-auto text-center text-gray-500"
          >
            {dictionary.pages.earn.basic_income.subtitle_claim}
            <span className="inline-flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => setIsLearnMoreDrawerOpen(true)}
                className="inline-flex shrink-0 items-center justify-center text-gray-400"
                aria-label="Learn more"
              >
                <PiInfoFill className="ml-1 size-4 translate-y-[2px]!" />
              </button>
            </span>
          </Typography>
          <LearnMoreDrawer
            open={isLearnMoreDrawerOpen}
            onOpenChange={setIsLearnMoreDrawerOpen}
            title={dictionary.pages.govern.parties.learn_more}
            closeLabel={dictionary.common.close}
            info={dictionary.pages.earn.basic_income.tooltip_claim}
          />
          <div className="mt-5 mb-1 font-mono text-7xl font-semibold">
            {amountString}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                fullWidth
                className="mt-6! shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
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
                  <Button
                    onClick={handleClaim}
                    fullWidth
                  >
                    {dictionary.common.confirm}
                  </Button>
                </AlertDialogClose>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
