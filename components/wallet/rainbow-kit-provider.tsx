"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { fallback, http } from "viem";
import { WagmiProvider } from "wagmi";
import { worldchain } from "wagmi/chains";

const WORLD_CHAIN_RPC_URLS = [
  "https://worldchain-mainnet.g.alchemy.com/public",
  "https://480.rpc.thirdweb.com",
  "https://worldchain.drpc.org",
  "https://sparkling-autumn-dinghy.worldchain-mainnet.quiknode.pro",
  "https://worldchain-mainnet.gateway.tenderly.co",
] as const;

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "b56e18d47c72ab683b10814fe9495694";

const wagmiConfig = getDefaultConfig({
  appName: "World Republic",
  projectId: walletConnectProjectId,
  chains: [worldchain],
  ssr: true,
  transports: {
    [worldchain.id]: fallback(WORLD_CHAIN_RPC_URLS.map((url) => http(url))),
  },
});

export function RainbowKitWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
