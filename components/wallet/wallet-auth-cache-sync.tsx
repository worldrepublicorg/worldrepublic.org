"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

const WALLET_AUTH_STATE_KEY = "walletAuthState";

/**
 * Syncs wallet auth state to localStorage when the user is authenticated.
 * Ensures Google sign-in (after redirect) and passkey sign-in both update
 * the cache so the wallet page can show the correct state on next visit.
 */
export function WalletAuthCacheSync() {
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      try {
        localStorage.setItem(
          WALLET_AUTH_STATE_KEY,
          JSON.stringify({ authenticated: true }),
        );
      } catch {
        // ignore
      }
    }
  }, [status]);

  return null;
}
