"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { fallback, http } from "viem";
import { createConfig, createStorage, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

const BASE_CHAIN_RPC_URLS = [
	"https://lb.drpc.live/base/AgobUm8RhkrUlOLZyf0lrdR8c2tmPtMR8ZnbtiKh6MJI",
	"https://mainnet.base.org",
	"https://base.drpc.org",
	"https://1rpc.io/base",
	"https://base.llamarpc.com",
	"https://base-rpc.publicnode.com",
	"https://base.public.blockpi.network/v1/rpc/public",
	"https://base.meowrpc.com",
	"https://base-public.nodies.app",
	"https://base-mainnet.public.blastapi.io",
] as const;

const wagmiConfig = createConfig({
	chains: [base],
	connectors: [
		baseAccount({
			appName: "World Republic",
		}),
		injected(),
	],
	ssr: true,
	storage: createStorage({
		storage: typeof window !== "undefined" ? window.localStorage : undefined,
	}),
	transports: {
		[base.id]: fallback(BASE_CHAIN_RPC_URLS.map((url) => http(url))),
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
