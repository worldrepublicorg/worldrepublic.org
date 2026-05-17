import {
	BaseError,
	ContractFunctionRevertedError,
	UserRejectedRequestError,
} from "viem";

export function formatTxError(err: unknown): string {
	if (err instanceof BaseError) {
		const rejected = err.walk((e) => e instanceof UserRejectedRequestError);
		if (rejected) return "Transaction rejected";

		const reverted = err.walk(
			(e) => e instanceof ContractFunctionRevertedError,
		);
		if (reverted instanceof ContractFunctionRevertedError) {
			return reverted.shortMessage || "Transaction reverted";
		}

		return err.shortMessage || err.message.split("\n")[0];
	}

	if (err instanceof Error) {
		return err.message.split("\n")[0];
	}

	return "Transaction failed";
}
