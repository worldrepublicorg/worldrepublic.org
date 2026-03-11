"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useState } from "react";
import {
  activateBasicIncome,
  claimBasicIncome,
} from "@/lib/actions/member";

const BALANCE_CAP = 9.99;

export function useBasicIncome(
  basicIncomeActivatedAt: number | null,
  lastBasicIncomeClaimAt: number | null,
  walletBalance: number | null,
  onSuccess: () => void,
) {
  const [isActivating, setIsActivating] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimableAmount, setClaimableAmount] = useState(0);
  const [maxClaimableAmount, setMaxClaimableAmount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!basicIncomeActivatedAt) return;

    const anchor = lastBasicIncomeClaimAt ?? basicIncomeActivatedAt;

    const calculate = () => {
      const elapsedDays = (Date.now() - anchor) / 86_400_000;
      const claimable = Math.max(0, Math.min(elapsedDays, 1));
      setClaimableAmount(claimable);

      const maxCanClaim = Math.max(0, BALANCE_CAP - (walletBalance ?? 0));
      setMaxClaimableAmount(Math.min(claimable, maxCanClaim));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [basicIncomeActivatedAt, lastBasicIncomeClaimAt, walletBalance]);

  const handleActivate = async () => {
    setIsActivating(true);
    try {
      const result = await activateBasicIncome();
      if (result.success) {
        toast.success({ title: "Basic income activated" });
        await onSuccess();
      } else {
        toast.error({ title: result.error || "Failed to activate" });
      }
    } catch {
      toast.error({ title: "Failed to activate" });
    } finally {
      setIsActivating(false);
    }
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      const result = await claimBasicIncome();
      if (result.success) {
        toast.success({ title: "Claimed" });
        await onSuccess();
      } else {
        toast.error({ title: result.error || "Failed to claim" });
      }
    } catch {
      toast.error({ title: "Failed to claim" });
    } finally {
      setIsClaiming(false);
    }
  };

  return {
    isActivating,
    isClaiming,
    claimableAmount,
    maxClaimableAmount,
    handleActivate,
    handleClaim,
  };
}
