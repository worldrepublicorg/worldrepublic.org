"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiWalletFill } from "react-icons/pi";
import { useLiveWalletBalance } from "@/hooks/use-live-wallet-balance";
import type { StreamData } from "@/lib/streams";
import { getBalancePrecision, truncateToPrecision } from "@/lib/utils";

interface TopbarWalletBalanceDisplayProps {
	lang: string;
	href?: string;
	/** From getWalletAuthAndData; live accrual when non-empty */
	streams?: StreamData[] | null;
	storedWalletBalance?: number;
	/** profileData.walletBalance snapshot from last fetch */
	snapshotBalance?: number | null;
}

export function TopbarWalletBalanceDisplay({
	lang,
	href,
	streams,
	storedWalletBalance = 0,
	snapshotBalance = null,
}: TopbarWalletBalanceDisplayProps) {
	const pathname = usePathname();
	const locale = lang.trim() || "en";

	const liveTotal = useLiveWalletBalance(
		streams,
		storedWalletBalance,
		snapshotBalance,
	);
	const displayBalanceNumber = liveTotal ?? 0;

	const precision = getBalancePrecision(displayBalanceNumber);
	const truncatedDisplayBalance = truncateToPrecision(
		displayBalanceNumber,
		precision,
	);
	const finalPrecision = truncatedDisplayBalance === 0 ? 2 : precision;
	const displayBalance = truncatedDisplayBalance.toLocaleString(locale, {
		minimumFractionDigits: finalPrecision,
		maximumFractionDigits: finalPrecision,
	});

	const targetHref = href ?? `/${lang}/menu/wallet`;

	return (
		<Link
			href={targetHref}
			onClick={() => {
				localStorage.setItem("walletReturnUrl", pathname);
			}}
		>
			<div className="flex h-10 cursor-pointer items-center rounded-full bg-gray-100 px-4">
				<PiWalletFill className="mr-2 h-5 w-5 text-gray-900" />
				<Typography variant="number" level={5} className="mr-1! font-mono">
					{displayBalance}
				</Typography>
			</div>
		</Link>
	);
}
