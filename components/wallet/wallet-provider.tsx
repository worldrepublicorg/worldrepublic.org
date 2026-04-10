"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { cookieStorage, createStorage, WagmiProvider } from "wagmi";
import { walletAuthChains } from "@/lib/wallet/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694";

const wagmiConfig = getDefaultConfig({
  appName: "World Republic",
  projectId: walletConnectProjectId,
  chains: walletAuthChains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
