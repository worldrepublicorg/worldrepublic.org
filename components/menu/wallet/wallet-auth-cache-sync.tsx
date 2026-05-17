"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { getWalletAuthAndData } from "@/lib/actions/member";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";

/**
 * Syncs wallet auth state to localStorage when the user is authenticated.
 * Ensures Google sign-in (after redirect) and passkey sign-in both update
 * the cache so the wallet page can show the correct state on next visit.
 */
export function WalletAuthCacheSync() {
	const { status } = useSession();
	const previousStatusRef = useRef(status);

	useEffect(() => {
		const becameAuthenticated =
			previousStatusRef.current !== "authenticated" &&
			status === "authenticated";
		previousStatusRef.current = status;

		if (!becameAuthenticated) return;

		let cancelled = false;
		getWalletAuthAndData().then((result) => {
			if (cancelled) return;
			setCachedWalletData(result);
		});

		return () => {
			cancelled = true;
		};
	}, [status]);

	return null;
}
