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
import { useEffect, useState } from "react";
import { PiHandCoinsFill, PiInfoFill } from "react-icons/pi";
import { useBasicIncome } from "@/hooks/use-basic-income";

interface BasicIncomeSectionProps {
  isAuthenticated: boolean;
  basicIncomeActivatedAt: number | null;
  lastBasicIncomeClaimAt: number | null;
  basicIncomeClaimedTotal: number | null;
  onSignIn: () => void;
  onSuccess: () => void;
}

export function BasicIncomeSection({
  isAuthenticated,
  basicIncomeActivatedAt,
  lastBasicIncomeClaimAt,
  basicIncomeClaimedTotal,
  onSignIn,
  onSuccess,
}: BasicIncomeSectionProps) {
  const [showTooltip, setShowTooltip] = useState(false);

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

  useEffect(() => {
    const handleClickOutside = () => setShowTooltip(false);
    if (showTooltip) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showTooltip]);

  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTooltip(!showTooltip);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex grow items-center justify-center">
        <div className="flex w-full flex-col items-center p-6">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <PiHandCoinsFill className="h-10 w-10 text-gray-400" />
          </div>
          <div className="flex w-full flex-col items-center gap-4">
            <Typography variant="heading" level={2}>
              Basic income
            </Typography>
            <Typography
              variant="subtitle"
              level={2}
              className="text-gray-500"
            >
              Get money for being human
            </Typography>
            <div className="mt-6 w-full">
              <Button
                fullWidth
                className="shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
                onClick={onSignIn}
              >
                Sign in
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
              Basic income
            </Typography>
            <Typography
              variant="subtitle"
              level={2}
              className="text-gray-500"
            >
              Set up your basic income
            </Typography>
            <Button
              fullWidth
              className="mt-6! shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
              onClick={handleActivate}
              disabled={isActivating}
            >
              {isActivating ? "Activating..." : "Activate basic income"}
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
            Basic income
          </Typography>
          <Typography
            variant="subtitle"
            level={2}
            className="mx-auto text-center text-gray-500"
          >
            Claim your drachma
            <span className="group relative inline-flex items-center align-baseline">
              <PiInfoFill
                className="ml-1 h-4 w-4 translate-y-[2px]! cursor-help text-gray-400"
                onClick={handleTooltipClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              />
              {showTooltip && (
                <div className="absolute -right-4 bottom-full z-40 mb-2 w-[calc(100dvw/2+24px)] max-w-xs transform rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg!">
                  <div className="rounded-lg bg-white text-left text-xs text-gray-700">
                    1 WDD/day, capped at 1 WDD. Return within 24 hours to
                    maximize earnings.
                  </div>
                </div>
              )}
            </span>
          </Typography>
          <div className="mt-5 mb-1 font-mono text-7xl font-semibold">
            {maxClaimableAmount.toFixed(6)}
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                fullWidth
                className="mt-6! shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
                disabled={isClaiming || maxClaimableAmount <= 0}
              >
                Claim
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
                <AlertDialogTitle>Confirm claim</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>
                You are about to claim {maxClaimableAmount.toFixed(6)} WDD. This
                will be added to your wallet balance.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogClose asChild>
                  <Button
                    onClick={handleClaim}
                    fullWidth
                    className="shadow-[0_4px_10px_rgba(0,0,0,0.19)]!"
                  >
                    Confirm
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
