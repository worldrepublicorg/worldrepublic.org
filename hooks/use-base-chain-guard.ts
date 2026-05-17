"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useState } from "react";
import type { Connector } from "wagmi";
import { useConnection, useSwitchChain } from "wagmi";
import { base } from "wagmi/chains";
import { formatTxError } from "@/lib/format-tx-error";

const BASE_CHAIN_ID_HEX = `0x${base.id.toString(16)}` as const;

const BASE_CHAIN_ADD_PARAMS = {
	chainId: BASE_CHAIN_ID_HEX,
	chainName: "Base Chain",
	nativeCurrency: base.nativeCurrency,
	rpcUrls: [...base.rpcUrls.default.http],
	blockExplorerUrls: base.blockExplorers?.default?.url
		? [base.blockExplorers.default.url]
		: [],
} as const;

type EthereumProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function parseHexChainId(raw: unknown): number | null {
	if (typeof raw !== "string") return null;
	const normalized = raw.trim().toLowerCase();
	if (!normalized.startsWith("0x")) return null;
	const parsed = Number.parseInt(normalized, 16);
	return Number.isFinite(parsed) ? parsed : null;
}

function getErrorCode(err: unknown): number | undefined {
	const code = (err as { code?: number })?.code;
	if (typeof code === "number") return code;
	const innerCode = (err as { data?: { originalError?: { code?: number } } })
		?.data?.originalError?.code;
	return typeof innerCode === "number" ? innerCode : undefined;
}

function isUserRejection(err: unknown): boolean {
	const code = getErrorCode(err);
	const message = (err as { message?: string })?.message ?? "";
	return code === 4001 || /user rejected|user denied/i.test(message);
}

function looksLikeUnknownChain(err: unknown): boolean {
	const code = getErrorCode(err);
	const message = (err as { message?: string })?.message ?? "";
	return (
		code === 4902 ||
		code === -32603 ||
		/Unrecognized chain|not (been )?added|unknown chain|add the chain|attempting to switch chain/i.test(
			message,
		)
	);
}

async function addBaseChain(connector: Connector): Promise<void> {
	const provider = (await connector.getProvider()) as EthereumProvider;
	await provider.request({
		method: "wallet_addEthereumChain",
		params: [BASE_CHAIN_ADD_PARAMS],
	});
}

async function switchBaseChain(connector: Connector): Promise<void> {
	const provider = (await connector.getProvider()) as EthereumProvider;
	await provider.request({
		method: "wallet_switchEthereumChain",
		params: [{ chainId: BASE_CHAIN_ID_HEX }],
	});
}

async function switchOrAddBaseChain(connector: Connector): Promise<void> {
	try {
		await switchBaseChain(connector);
		return;
	} catch (switchErr) {
		if (isUserRejection(switchErr)) {
			throw switchErr;
		}

		if (!looksLikeUnknownChain(switchErr)) {
			try {
				await addBaseChain(connector);
				await switchBaseChain(connector);
				return;
			} catch {
				// Fall through to original error handling below.
			}
			throw switchErr;
		}
	}

	await addBaseChain(connector);
	await switchBaseChain(connector);
}

export function useBaseChainGuard() {
	const { isConnected, connector } = useConnection();
	const switchChain = useSwitchChain();
	const { toast } = useToast();
	const [isSwitching, setIsSwitching] = useState(false);
	const [liveChainId, setLiveChainId] = useState<number | null>(null);

	const refreshLiveChainId = useCallback(async () => {
		if (!isConnected || !connector) {
			setLiveChainId(null);
			return null;
		}

		try {
			const provider = (await connector.getProvider()) as EthereumProvider;
			const rawChainId = await provider.request({ method: "eth_chainId" });
			const parsedChainId = parseHexChainId(rawChainId);
			setLiveChainId(parsedChainId);
			return parsedChainId;
		} catch {
			setLiveChainId(null);
			return null;
		}
	}, [isConnected, connector]);

	useEffect(() => {
		void refreshLiveChainId();
	}, [refreshLiveChainId]);

	useEffect(() => {
		if (typeof window === "undefined" || !isConnected) return;
		const handleFocusRefresh = () => {
			void refreshLiveChainId();
		};
		window.addEventListener("focus", handleFocusRefresh);
		document.addEventListener("visibilitychange", handleFocusRefresh);
		return () => {
			window.removeEventListener("focus", handleFocusRefresh);
			document.removeEventListener("visibilitychange", handleFocusRefresh);
		};
	}, [isConnected, refreshLiveChainId]);

	const switchToBaseChain = useCallback(async () => {
		if (!isConnected || !connector) {
			toast.error({ title: "Connect your wallet first." });
			return false;
		}
		if (isSwitching) return false;

		const preflightChainId = await refreshLiveChainId();
		if (preflightChainId === base.id) return true;

		setIsSwitching(true);

		try {
			try {
				await switchOrAddBaseChain(connector);
			} catch (manualErr) {
				if (isUserRejection(manualErr)) throw manualErr;
				await switchChain.mutateAsync({
					chainId: base.id,
					addEthereumChainParameter: {
						chainName: BASE_CHAIN_ADD_PARAMS.chainName,
						nativeCurrency: BASE_CHAIN_ADD_PARAMS.nativeCurrency,
						rpcUrls: [...BASE_CHAIN_ADD_PARAMS.rpcUrls],
						blockExplorerUrls: [...BASE_CHAIN_ADD_PARAMS.blockExplorerUrls],
					},
				});
			}
			const currentLiveChainId = await refreshLiveChainId();
			if (currentLiveChainId !== base.id) {
				toast.error({
					title:
						"Couldn't switch to Base Chain. Please switch networks in your wallet.",
				});
				return false;
			}
			return true;
		} catch (err) {
			toast.error({ title: formatTxError(err) });
			return false;
		} finally {
			setIsSwitching(false);
		}
	}, [
		isConnected,
		connector,
		isSwitching,
		switchChain,
		toast,
		refreshLiveChainId,
	]);

	const isOnBaseChain = isConnected && liveChainId === base.id;

	return {
		isOnBaseChain,
		liveChainId,
		isSwitching,
		switchToBaseChain,
	};
}
