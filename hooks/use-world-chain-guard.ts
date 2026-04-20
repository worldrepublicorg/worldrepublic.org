"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useState } from "react";
import type { Connector } from "wagmi";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { formatTxError } from "@/lib/format-tx-error";

export const WORLD_CHAIN_ID = 480;
const WORLD_CHAIN_ID_HEX = "0x1e0";

const WORLD_CHAIN_ADD_PARAMS = {
  chainId: WORLD_CHAIN_ID_HEX,
  chainName: "World Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: [
    "https://worldchain-mainnet.g.alchemy.com/public",
    "https://480.rpc.thirdweb.com",
  ],
  blockExplorerUrls: ["https://worldscan.org"],
} as const;

type EthereumProvider = {
  request: (args: {
    method: string;
    params?: unknown[];
  }) => Promise<unknown>;
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
    /Unrecognized chain|not (been )?added|unknown chain|add the chain/i.test(
      message,
    )
  );
}

async function switchOrAddWorldChain(connector: Connector): Promise<void> {
  const provider = (await connector.getProvider()) as EthereumProvider;

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: WORLD_CHAIN_ID_HEX }],
    });
    return;
  } catch (err) {
    if (!looksLikeUnknownChain(err)) {
      throw err;
    }
  }

  await provider.request({
    method: "wallet_addEthereumChain",
    params: [WORLD_CHAIN_ADD_PARAMS],
  });

  // Some wallets add without switching; retry.
  await provider.request({
    method: "wallet_switchEthereumChain",
    params: [{ chainId: WORLD_CHAIN_ID_HEX }],
  });
}

export function useWorldChainGuard() {
  const { isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
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
  }, [refreshLiveChainId, chainId]);

  const switchToWorldChain = useCallback(async () => {
    if (!isConnected || !connector) {
      toast.error({ title: "Connect your wallet first." });
      return false;
    }
    if (isSwitching) return false;
    if (chainId === WORLD_CHAIN_ID) return true;

    setIsSwitching(true);

    try {
      try {
        await switchOrAddWorldChain(connector);
      } catch (manualErr) {
        if (isUserRejection(manualErr)) throw manualErr;
        await switchChainAsync({
          chainId: WORLD_CHAIN_ID,
          addEthereumChainParameter: {
            chainName: WORLD_CHAIN_ADD_PARAMS.chainName,
            nativeCurrency: WORLD_CHAIN_ADD_PARAMS.nativeCurrency,
            rpcUrls: [...WORLD_CHAIN_ADD_PARAMS.rpcUrls],
            blockExplorerUrls: [...WORLD_CHAIN_ADD_PARAMS.blockExplorerUrls],
          },
        });
      }
      const currentLiveChainId = await refreshLiveChainId();
      if (
        currentLiveChainId !== null &&
        currentLiveChainId !== WORLD_CHAIN_ID
      ) {
        toast.error({ title: "Please switch to World Chain to continue." });
        return false;
      }
      return currentLiveChainId === null ? chainId === WORLD_CHAIN_ID : true;
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
    chainId,
    switchChainAsync,
    toast,
    refreshLiveChainId,
  ]);

  const isOnWorldChain = (liveChainId ?? chainId) === WORLD_CHAIN_ID;

  return {
    isOnWorldChain,
    liveChainId,
    isSwitching,
    switchToWorldChain,
  };
}
