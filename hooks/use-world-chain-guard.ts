"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useRef } from "react";
import type { Connector } from "wagmi";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";
import { formatTxError } from "@/lib/format-tx-error";

const WORLD_CHAIN_ID = 480;
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
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (
      !isConnected ||
      !connector ||
      chainId === WORLD_CHAIN_ID ||
      inFlightRef.current
    ) {
      return;
    }

    inFlightRef.current = true;

    void (async () => {
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
      } catch (err) {
        toast.error({ title: formatTxError(err) });
        disconnect();
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [
    isConnected,
    connector,
    chainId,
    switchChainAsync,
    disconnect,
    toast,
  ]);
}
