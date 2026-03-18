"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PiWalletFill } from "react-icons/pi";
import { truncateToPrecision } from "@/lib/utils";

interface TopbarWalletBalanceDisplayProps {
  walletBalance: number | null;
  lang: string;
  href?: string;
}

export function TopbarWalletBalanceDisplay({
  walletBalance,
  lang,
  href,
}: TopbarWalletBalanceDisplayProps) {
  const pathname = usePathname();
  const locale = lang.trim() || "en";
  const displayBalanceNumber = walletBalance || 0;

  const truncatedDisplay = Math.floor(displayBalanceNumber * 1e18) / 1e18;
  const safeDisplayAmount = Math.max(0, truncatedDisplay - 1e-12);
  const precision = safeDisplayAmount === 0 ? 2 : 5;
  const truncatedDisplayBalance = truncateToPrecision(
    safeDisplayAmount,
    precision,
  );
  const displayBalance = truncatedDisplayBalance.toLocaleString(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  const targetHref = href ?? `/${lang}/menu/wallet`;

  return (
    <Link
      href={targetHref}
      onClick={() => {
        // Store the current page as the return URL for wallet/menu flows
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

