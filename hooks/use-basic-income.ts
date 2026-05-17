"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { activateBasicIncome, claimBasicIncome } from "@/lib/actions/member";

const BALANCE_CAP = 9.99;

export function useBasicIncome(
	dictionary: Dictionary,
	basicIncomeActivatedAt: number | null,
	lastBasicIncomeClaimAt: number | null,
	basicIncomeAndInterestClaimedTotal: number | null,
	isSelfVerified: boolean,
	isActive: boolean,
	onSuccess: () => void,
) {
	const [isActivating, setIsActivating] = useState(false);
	const [isClaiming, setIsClaiming] = useState(false);
	const [claimableAmount, setClaimableAmount] = useState(0);
	const [maxClaimableAmount, setMaxClaimableAmount] = useState(0);
	const { toast } = useToast();

	useEffect(() => {
		if (!isActive || !basicIncomeActivatedAt) return;

		const anchor = lastBasicIncomeClaimAt ?? basicIncomeActivatedAt;

		const calculate = () => {
			const elapsedDays = (Date.now() - anchor) / 86_400_000;
			const claimable = Math.max(0, Math.min(elapsedDays, 1));
			setClaimableAmount(claimable);

			const maxCanClaim = isSelfVerified
				? claimable
				: Math.max(0, BALANCE_CAP - (basicIncomeAndInterestClaimedTotal ?? 0));
			setMaxClaimableAmount(Math.min(claimable, maxCanClaim));
		};

		calculate();
		const interval = setInterval(calculate, 1000);
		return () => clearInterval(interval);
	}, [
		isActive,
		basicIncomeActivatedAt,
		lastBasicIncomeClaimAt,
		basicIncomeAndInterestClaimedTotal,
		isSelfVerified,
	]);

	const handleActivate = async () => {
		setIsActivating(true);
		try {
			const result = await activateBasicIncome();
			if (result.success) {
				toast.success({ title: dictionary.toasts.basic_income.activated });
				await onSuccess();
			} else {
				toast.error({ title: dictionary.toasts.basic_income.activate_failed });
			}
		} catch {
			toast.error({ title: dictionary.toasts.basic_income.activate_failed });
		} finally {
			setIsActivating(false);
		}
	};

	const handleClaim = async () => {
		setIsClaiming(true);
		try {
			const result = await claimBasicIncome();
			if (result.success) {
				toast.success({ title: dictionary.toasts.basic_income.claimed });
				await onSuccess();
			} else {
				toast.error({ title: dictionary.toasts.basic_income.claim_failed });
			}
		} catch {
			toast.error({ title: dictionary.toasts.basic_income.claim_failed });
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
