import type {
  GetWalletAuthAndDataProfileData,
  GetWalletAuthAndDataResult,
  GetWalletAuthAndDataTransaction,
} from "@/lib/actions/member";

export const WALLET_AUTH_STATE_KEY = "walletAuthState";

export function getCachedWalletData(): GetWalletAuthAndDataResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WALLET_AUTH_STATE_KEY);
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
    localStorage.setItem(WALLET_AUTH_STATE_KEY, JSON.stringify(result));
  } catch {
    // ignore
  }
}
