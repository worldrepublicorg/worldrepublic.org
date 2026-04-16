import type {
  GetWalletAuthAndDataProfileData,
  GetWalletAuthAndDataResult,
  GetWalletAuthAndDataTransaction,
} from "@/lib/actions/member";
import type { StreamData } from "@/lib/streams";

export const AUTH_DISPLAY_CACHE_KEY = "authDisplayCache";
const walletAuthCacheListeners = new Set<() => void>();

function emitWalletAuthCacheChange() {
  walletAuthCacheListeners.forEach((listener) => listener());
}

export function getCachedWalletData(): GetWalletAuthAndDataResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_DISPLAY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "authenticated" in parsed &&
      typeof (parsed as { authenticated: unknown }).authenticated === "boolean"
    ) {
      const obj = parsed as Record<string, unknown>;
      return {
        authenticated: obj.authenticated as boolean,
        profileData:
          (obj.profileData as GetWalletAuthAndDataProfileData) ?? null,
        transactions:
          (obj.transactions as GetWalletAuthAndDataTransaction[]) ?? null,
        streams: (obj.streams as StreamData[]) ?? null,
        streamRatesById:
          (obj.streamRatesById as Record<string, number> | null) ?? null,
        email: (obj.email as string) ?? null,
        linkedProviders:
          (obj.linkedProviders as GetWalletAuthAndDataResult["linkedProviders"]) ??
          null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedWalletData(result: GetWalletAuthAndDataResult) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_DISPLAY_CACHE_KEY, JSON.stringify(result));
    emitWalletAuthCacheChange();
  } catch {
    // ignore
  }
}

export function subscribeWalletAuthCache(listener: () => void) {
  walletAuthCacheListeners.add(listener);
  return () => {
    walletAuthCacheListeners.delete(listener);
  };
}
