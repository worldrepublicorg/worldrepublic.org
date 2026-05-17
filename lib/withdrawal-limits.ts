const DEFAULT_MIN_WITHDRAWAL_AMOUNT = 10;
const WORLD_CHAIN_MIN_WITHDRAWAL_AMOUNT = 10;
const BASE_CHAIN_MIN_WITHDRAWAL_AMOUNT = 10;

export function getMinWithdrawalAmount(chainId: string): number {
	if (chainId === "480") {
		return WORLD_CHAIN_MIN_WITHDRAWAL_AMOUNT;
	}

	if (chainId === "8453") {
		return BASE_CHAIN_MIN_WITHDRAWAL_AMOUNT;
	}

	// Before selecting a chain (or for unknown values), fall back to 10 WDD.
	return DEFAULT_MIN_WITHDRAWAL_AMOUNT;
}
