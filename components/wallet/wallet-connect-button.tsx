"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from "@worldcoin/mini-apps-ui-kit-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface WalletConnectButtonProps {
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  fullWidth?: boolean;
  className?: string;
  connectLabel?: string;
  disconnectLabel?: string;
}

export function WalletConnectButton({
  variant = "tertiary",
  size = "sm",
  fullWidth = false,
  className,
  connectLabel = "Connect wallet",
  disconnectLabel = "Disconnect",
}: WalletConnectButtonProps = {}) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletBrowserDialogOpen, setWalletBrowserDialogOpen] = useState(false);

  const handleWalletButtonClick = async () => {
    if (isConnected) {
      disconnect();
      return;
    }

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
      <Button
        variant={variant}
        size={size}
        onClick={() => void handleWalletButtonClick()}
        disabled={isPending}
        fullWidth={fullWidth}
        className={`h-10 rounded-full px-4 text-sm font-semibold ${className ?? ""}`}
      >
        {isConnected ? disconnectLabel : connectLabel}
      </Button>

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
