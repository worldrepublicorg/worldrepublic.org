"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { fallback, http } from "viem";
import { createConfig, createStorage, WagmiProvider } from "wagmi";
import { worldchain } from "wagmi/chains";
import { injected } from "wagmi/connectors";

const WORLD_CHAIN_RPC_URLS = [
  "https://worldchain-mainnet.g.alchemy.com/public",
  "https://480.rpc.thirdweb.com",
  "https://worldchain.drpc.org",
  "https://sparkling-autumn-dinghy.worldchain-mainnet.quiknode.pro",
  "https://worldchain-mainnet.gateway.tenderly.co",
] as const;

const wagmiConfig = createConfig({
  chains: [worldchain],
  connectors: [injected()],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  }),
  transports: {
    [worldchain.id]: fallback(WORLD_CHAIN_RPC_URLS.map((url) => http(url))),
  },
});

export function OnchainWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
