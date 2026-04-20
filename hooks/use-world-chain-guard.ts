"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useRef } from "react";
import { useAccount, useChainId, useDisconnect, useSwitchChain } from "wagmi";

const WORLD_CHAIN_ID = 480;

export function useWorldChainGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (!isConnected || chainId === WORLD_CHAIN_ID || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;

    void (async () => {
      try {
        await switchChainAsync({ chainId: WORLD_CHAIN_ID });
      } catch {
        toast.error({
          title: "This wallet can't use World Chain.",
        });
        disconnect();
      } finally {
        inFlightRef.current = false;
      }
    })();
  }, [isConnected, chainId, switchChainAsync, disconnect, toast]);
}
