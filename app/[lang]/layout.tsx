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
    <SessionProvider refetchOnWindowFocus={true}>
      <WalletProvider>
        <WalletAuthCacheSync />
        {children}
      </WalletProvider>
    </SessionProvider>
  );
}
