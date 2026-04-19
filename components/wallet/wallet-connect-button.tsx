"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { PiLinkBreakFill, PiWalletFill } from "react-icons/pi";
import { formatUnits } from "viem";
import { useAccount, useConnect, useDisconnect, useReadContract } from "wagmi";
import { getBalancePrecision, truncateToPrecision } from "@/lib/utils";

const WORLD_CHAIN_ID = 480;
const WDD_TOKEN_ADDRESS = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" as const;
const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

interface WalletConnectButtonProps {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  fullWidth?: boolean;
  className?: string;
  compact?: boolean;
  connectLabel?: string;
  disconnectLabel?: string;
  lang?: string;
}

export function WalletConnectButton({
  variant = "tertiary",
  size,
  fullWidth = false,
  className,
  compact = true,
  connectLabel = "Connect wallet",
  disconnectLabel = "Disconnect",
  lang = "en",
}: WalletConnectButtonProps = {}) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletBrowserDialogOpen, setWalletBrowserDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);

  const { data: tokenDecimalsData } = useReadContract({
    abi: erc20BalanceAbi,
    address: WDD_TOKEN_ADDRESS,
    functionName: "decimals",
    chainId: WORLD_CHAIN_ID,
  });

  const { data: tokenBalanceData } = useReadContract({
    abi: erc20BalanceAbi,
    address: WDD_TOKEN_ADDRESS,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: WORLD_CHAIN_ID,
    query: {
      enabled: Boolean(address),
    },
  });

  const decimals = Number(tokenDecimalsData ?? 18);
  const rawBalance =
    tokenBalanceData !== undefined
      ? Number(formatUnits(tokenBalanceData, decimals))
      : 0;
  const precision = getBalancePrecision(rawBalance);
  const truncatedBalance = truncateToPrecision(rawBalance, precision);
  const finalPrecision = truncatedBalance === 0 ? 2 : precision;
  const locale = lang.trim() || "en";
  const displayBalance = truncatedBalance.toLocaleString(locale, {
    minimumFractionDigits: finalPrecision,
    maximumFractionDigits: finalPrecision,
  });

  const handleWalletButtonClick = async () => {
    const userAgent =
      typeof window === "undefined" ? "" : window.navigator.userAgent;
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );

    if (!isMobileDevice && openConnectModal) {
      openConnectModal();
      return;
    }

    const injectedConnector = connectors.find(
      (connector) => connector.id === "injected",
    );
    if (injectedConnector) {
      const provider = await injectedConnector.getProvider();
      if (provider) {
        connect({ connector: injectedConnector });
        return;
      }
    }

    setWalletBrowserDialogOpen(true);
  };

  return (
    <>
      {isConnected ? (
        <AlertDialog
          open={disconnectDialogOpen}
          onOpenChange={setDisconnectDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex h-10 cursor-pointer items-center rounded-full bg-gray-100 px-4"
            >
              <PiWalletFill className="mr-2 h-5 w-5 text-gray-900" />
              <Typography
                variant="number"
                level={5}
                className="mr-1! font-mono"
              >
                {displayBalance}
              </Typography>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader
              icon={
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                  <PiLinkBreakFill className="h-[30px] w-[30px] text-gray-400" />
                </div>
              }
            >
              <AlertDialogTitle>{disconnectLabel}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  disconnect();
                  setDisconnectDialogOpen(false);
                }}
              >
                {disconnectLabel}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={() => void handleWalletButtonClick()}
          disabled={isPending}
          fullWidth={fullWidth}
          className={`${compact ? "h-10 rounded-full px-4 text-sm font-semibold " : ""}${className ?? ""}`}
        >
          {connectLabel}
        </Button>
      )}

      <AlertDialog
        open={walletBrowserDialogOpen}
        onOpenChange={setWalletBrowserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>No wallet detected</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Please open this page inside a wallet app's built-in browser.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={() => setWalletBrowserDialogOpen(false)} fullWidth>
              OK
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
