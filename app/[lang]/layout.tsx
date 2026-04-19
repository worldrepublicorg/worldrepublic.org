"use client";

import { SessionProvider } from "next-auth/react";
import { RainbowKitWalletProvider } from "@/components/wallet/rainbow-kit-provider";
import { WalletAuthCacheSync } from "@/components/wallet/wallet-auth-cache-sync";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <RainbowKitWalletProvider>
        <WalletAuthCacheSync />
        {children}
      </RainbowKitWalletProvider>
    </SessionProvider>
  );
}
