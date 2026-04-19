"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function TopbarWalletConnectButton() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const handleWalletButtonClick = () => {
    if (isConnected) {
      disconnect();
      return;
    }

    const injectedConnector = connectors.find(
      (connector) => connector.id === "injected",
    );
    if (injectedConnector) {
      connect({ connector: injectedConnector });
      return;
    }

    if (openConnectModal) {
      openConnectModal();
      return;
    }
  };

  return (
    <Button
      variant="tertiary"
      size="sm"
      onClick={handleWalletButtonClick}
      disabled={isPending}
      className="h-10 rounded-full px-4 text-sm font-semibold"
    >
      {isConnected ? "Disconnect" : "Connect wallet"}
    </Button>
  );
}
