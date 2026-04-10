"use client";

import { SessionProvider } from "next-auth/react";
import { WalletAuthCacheSync } from "@/components/wallet/wallet-auth-cache-sync";
import { WalletProvider } from "@/components/wallet/wallet-provider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <SessionProvider refetchOnWindowFocus={true}>
        <WalletAuthCacheSync />
        {children}
      </SessionProvider>
    </WalletProvider>
  );
}
