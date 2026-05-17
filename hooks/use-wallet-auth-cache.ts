"use client";

import { useSyncExternalStore } from "react";
import type { GetWalletAuthAndDataResult } from "@/lib/actions/member";
import {
	AUTH_DISPLAY_CACHE_KEY,
	getCachedWalletData,
	subscribeWalletAuthCache,
} from "@/lib/wallet-auth-cache";

function subscribe(onStoreChange: () => void) {
	const unsubscribe = subscribeWalletAuthCache(onStoreChange);

	const handleStorage = (event: StorageEvent) => {
		if (event.key === AUTH_DISPLAY_CACHE_KEY) {
			onStoreChange();
		}
	};

	window.addEventListener("storage", handleStorage);

	return () => {
		unsubscribe();
		window.removeEventListener("storage", handleStorage);
	};
}

function getSnapshot(): GetWalletAuthAndDataResult | null {
	return getCachedWalletData();
}

function getServerSnapshot(): GetWalletAuthAndDataResult | null {
	return null;
}

export function useWalletAuthCache() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
