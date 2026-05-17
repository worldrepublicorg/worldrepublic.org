"use client";

import { SessionProvider } from "next-auth/react";
import { WalletAuthCacheSync } from "@/components/menu/wallet/wallet-auth-cache-sync";

export default function AuthLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SessionProvider refetchOnWindowFocus={true}>
			<WalletAuthCacheSync />
			{children}
		</SessionProvider>
	);
}
