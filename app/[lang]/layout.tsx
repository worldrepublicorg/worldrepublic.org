"use client";

import { SessionProvider } from "next-auth/react";
import { WalletAuthCacheSync } from "@/components/wallet/wallet-auth-cache-sync";
import { OnchainWalletProvider } from "@/components/wallet/onchain-wallet-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <OnchainWalletProvider>
        <WalletAuthCacheSync />
        {children}
      </OnchainWalletProvider>
    </SessionProvider>
  );
}
