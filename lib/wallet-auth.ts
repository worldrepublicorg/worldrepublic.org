export const WALLET_PROVIDER_ID = "wallet";

export const WALLET_AUTH_ALLOWED_CHAIN_IDS = [1, 480] as const;

export type WalletAuthAllowedChainId =
  (typeof WALLET_AUTH_ALLOWED_CHAIN_IDS)[number];

export type WalletAuthIntent = "signin" | "link";

export const WALLET_AUTH_NONCE_TTL_MS = 5 * 60 * 1000;

export function isWalletAuthIntent(value: string): value is WalletAuthIntent {
  return value === "signin" || value === "link";
}

export function isAllowedWalletAuthChainId(
  value: number,
): value is WalletAuthAllowedChainId {
  return WALLET_AUTH_ALLOWED_CHAIN_IDS.includes(
    value as WalletAuthAllowedChainId,
  );
}

export function normalizeWalletAddress(address: string): string {
  return address.toLowerCase();
}
