"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useState } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import {
	claimSavingsInterest,
	depositToSavings,
	withdrawFromSavings,
} from "@/lib/actions/member";
import { getMinWithdrawalAmount } from "@/lib/withdrawal-limits";

const SAVINGS_ANNUAL_INTEREST_RATE = 0.69;
const SAVINGS_DAILY_INTEREST_RATE = SAVINGS_ANNUAL_INTEREST_RATE / 365;
const NON_WITHDRAWABLE_BALANCE_BUFFER = 0.01;
const BASIC_INCOME_AND_SAVINGS_CAP = Math.max(
	0,
	getMinWithdrawalAmount("8453") - NON_WITHDRAWABLE_BALANCE_BUFFER,
);

export function useSavings(
	dictionary: Dictionary,
	savingsBalance: number,
	unclaimedSavingsInterest: number,
	savingsLastUpdatedAt: number | null,
	basicIncomeAndInterestClaimedTotal: number,
	isSelfVerified: boolean,
	isActive: boolean,
	onSuccess: () => Promise<void> | void,
) {
	const { toast } = useToast();
	const [amount, setAmount] = useState("");
	const [isSavingsLoading, setIsSavingsLoading] = useState(false);
	const [displayAvailableInterest, setDisplayAvailableInterest] = useState(0);
	const [maxCollectableAmount, setMaxCollectableAmount] = useState(0);

	useEffect(() => {
		if (!isActive) return;

		const calculateInterest = () => {
			if (!savingsLastUpdatedAt || savingsBalance <= 0) {
				const base = Math.max(0, unclaimedSavingsInterest);
				const maxCanCollect = isSelfVerified
					? base
					: Math.max(
							0,
							BASIC_INCOME_AND_SAVINGS_CAP - basicIncomeAndInterestClaimedTotal,
						);
				setDisplayAvailableInterest(base);
				setMaxCollectableAmount(Math.min(base, maxCanCollect));
				return;
			}

			const elapsedDays = (Date.now() - savingsLastUpdatedAt) / 86_400_000;
			const accrued =
				savingsBalance * SAVINGS_DAILY_INTEREST_RATE * Math.max(0, elapsedDays);
			const total = Math.max(0, unclaimedSavingsInterest + accrued);
			const maxCanCollect = isSelfVerified
				? total
				: Math.max(
						0,
						BASIC_INCOME_AND_SAVINGS_CAP - basicIncomeAndInterestClaimedTotal,
					);
			setDisplayAvailableInterest(total);
			setMaxCollectableAmount(Math.min(total, maxCanCollect));
		};

		calculateInterest();
		const interval = setInterval(calculateInterest, 1000);
		return () => clearInterval(interval);
	}, [
		isActive,
		savingsBalance,
		unclaimedSavingsInterest,
		savingsLastUpdatedAt,
		basicIncomeAndInterestClaimedTotal,
		isSelfVerified,
	]);

	const handleDeposit = async () => {
		const parsedAmount = Number(amount);
		if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

		setIsSavingsLoading(true);
		try {
			const result = await depositToSavings(parsedAmount);
			if (result.success) {
				toast.success({ title: dictionary.toasts.savings.deposited });
				setAmount("");
				await onSuccess();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.savings.deposit_failed,
				});
			}
		} catch {
			toast.error({ title: dictionary.toasts.generic_error });
		} finally {
			setIsSavingsLoading(false);
		}
	};

	const handleWithdraw = async () => {
		const parsedAmount = Number(amount);
		if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

		setIsSavingsLoading(true);
		try {
			const result = await withdrawFromSavings(parsedAmount);
			if (result.success) {
				toast.success({ title: dictionary.toasts.savings.withdrawn });
				setAmount("");
				await onSuccess();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.savings.withdraw_failed,
				});
			}
		} catch {
			toast.error({ title: dictionary.toasts.generic_error });
		} finally {
			setIsSavingsLoading(false);
		}
	};

	const handleCollectInterest = async () => {
		setIsSavingsLoading(true);
		try {
			const result = await claimSavingsInterest();
			if (result.success) {
				toast.success({ title: dictionary.toasts.savings.collected });
				await onSuccess();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.savings.collect_failed,
				});
			}
		} catch {
			toast.error({ title: dictionary.toasts.generic_error });
		} finally {
			setIsSavingsLoading(false);
		}
	};

	return {
		amount,
		setAmount,
		isSavingsLoading,
		displayAvailableInterest,
		maxCollectableAmount,
		handleDeposit,
		handleWithdraw,
		handleCollectInterest,
	};
}
