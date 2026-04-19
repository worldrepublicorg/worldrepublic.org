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
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function TopbarWalletConnectButton() {
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
        variant="tertiary"
        size="sm"
        onClick={() => void handleWalletButtonClick()}
        disabled={isPending}
        className="h-10 rounded-full px-4 text-sm font-semibold"
      >
        {isConnected ? "Disconnect" : "Connect wallet"}
      </Button>

      <AlertDialog
        open={walletBrowserDialogOpen}
        onOpenChange={setWalletBrowserDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Open in wallet browser</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            No wallet was detected in this browser. To connect without WalletConnect,
            open this website inside your wallet app's built-in browser.
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
