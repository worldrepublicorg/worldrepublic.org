"use client";

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
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { PiPowerFill, PiWalletFill } from "react-icons/pi";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useWorldchainSavingsAccount } from "@/hooks/use-worldchain-savings-account";
import {
  copyToClipboard,
  getBalancePrecision,
  truncateToPrecision,
} from "@/lib/utils";

interface ConnectWalletButtonProps {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  fullWidth?: boolean;
  className?: string;
  compact?: boolean;
  connectLabel?: string;
  disconnectLabel?: string;
  disconnectDescription?: string;
  walletBrowserDialogTitle?: string;
  walletBrowserDialogDescription?: string;
  walletBrowserDialogButtonLabel?: string;
  copiedToastTitle?: string;
  copyErrorToastTitle?: string;
  lang?: string;
}

export function ConnectWalletButton({
  variant = "tertiary",
  size,
  fullWidth = false,
  className,
  compact = true,
  connectLabel = "Connect wallet",
  disconnectLabel = "Disconnect",
  disconnectDescription = "Are you sure you want to disconnect your wallet?",
  walletBrowserDialogTitle = "Open in wallet app",
  walletBrowserDialogDescription = "To connect, copy this link and open it in a wallet app's built-in browser.",
  walletBrowserDialogButtonLabel = "Copy link",
  copiedToastTitle = "Copied",
  copyErrorToastTitle = "An error occurred",
  lang = "en",
}: ConnectWalletButtonProps = {}) {
  const { isConnected } = useAccount();
  const { toast } = useToast();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletBrowserDialogOpen, setWalletBrowserDialogOpen] = useState(false);
  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const worldchainAccount = useWorldchainSavingsAccount();
  const rawBalance = worldchainAccount.balances.wallet;
  const precision = getBalancePrecision(rawBalance);
  const truncatedBalance = truncateToPrecision(rawBalance, precision);
  const finalPrecision = truncatedBalance === 0 ? 2 : precision;
  const locale = lang.trim() || "en";
  const displayBalance = truncatedBalance.toLocaleString(locale, {
    minimumFractionDigits: finalPrecision,
    maximumFractionDigits: finalPrecision,
  });
  const walletSavingsUrl =
    "https://www.worldrepublic.org/?tab=savings&savings_account=worldchain";

  const handleWalletButtonClick = async () => {
    const userAgent =
      typeof window === "undefined" ? "" : window.navigator.userAgent;
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent,
      );
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

    if (isMobileDevice) {
      setWalletBrowserDialogOpen(true);
      return;
    }

    toast.error({
      title: "No browser wallet found",
    });
  };

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(walletSavingsUrl, toast, {
      success: copiedToastTitle,
      error: copyErrorToastTitle,
    });

    if (copied) {
      setWalletBrowserDialogOpen(false);
    }
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
                  <PiPowerFill className="h-[30px] w-[30px] text-gray-400" />
                </div>
              }
            >
              <AlertDialogTitle>{disconnectLabel}</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogDescription>
              {disconnectDescription}
            </AlertDialogDescription>
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
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiWalletFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <AlertDialogTitle>{walletBrowserDialogTitle}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {walletBrowserDialogDescription}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={() => void handleCopyLink()} fullWidth>
              {walletBrowserDialogButtonLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
