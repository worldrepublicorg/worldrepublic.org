"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

const WORLD_CHAIN_ID = 480;
const WDD_TOKEN_ADDRESS = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" as const;
const WORLD_SAVINGS_CONTRACT_ADDRESS =
  "0x234302Db10A54BDc11094A8Ef816B0Eaa5FCE3f7" as const;
const WDD_DECIMALS = 18;
// Match on-chain linear savings growth: balance doubles in 529 days.
const SECONDS_IN_529_DAYS = 529 * 86400;
const SAVINGS_PER_SECOND_RATE = 1 / SECONDS_IN_529_DAYS;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

const tokenStakingPerTokenAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "available",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export function useWorldchainSavingsAccount() {
  const { address, isConnected } = useAccount();
  const [displayAvailableInterest, setDisplayAvailableInterest] = useState(0);
  const snapshotTimeRef = useRef<number | null>(null);
  const snapshotSavingsRef = useRef(0);
  const baseAvailableRef = useRef(0);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: refetchContracts,
  } = useReadContracts({
    contracts: [
      {
        address: WDD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: WORLD_CHAIN_ID,
      },
      {
        address: WORLD_SAVINGS_CONTRACT_ADDRESS,
        abi: tokenStakingPerTokenAbi,
        functionName: "balanceOf",
        args: address ? [address] : undefined,
        chainId: WORLD_CHAIN_ID,
      },
      {
        address: WORLD_SAVINGS_CONTRACT_ADDRESS,
        abi: tokenStakingPerTokenAbi,
        functionName: "available",
        args: address ? [address] : undefined,
        chainId: WORLD_CHAIN_ID,
      },
    ],
    query: {
      enabled: Boolean(address),
    },
  });

  const walletBalance =
    data?.[0]?.result !== undefined
      ? Number(formatUnits(data[0].result as bigint, WDD_DECIMALS))
      : 0;
  const savingsBalance =
    data?.[1]?.result !== undefined
      ? Number(formatUnits(data[1].result as bigint, WDD_DECIMALS))
      : 0;
  const availableInterest =
    data?.[2]?.result !== undefined
      ? Number(formatUnits(data[2].result as bigint, WDD_DECIMALS))
      : 0;

  useEffect(() => {
    if (!isConnected || !address) {
      snapshotTimeRef.current = null;
      snapshotSavingsRef.current = 0;
      baseAvailableRef.current = 0;
      setDisplayAvailableInterest(0);
      return;
    }

    snapshotTimeRef.current = Date.now();
    snapshotSavingsRef.current = savingsBalance;
    baseAvailableRef.current = availableInterest;
    setDisplayAvailableInterest(availableInterest);
  }, [isConnected, address, savingsBalance, availableInterest]);

  useEffect(() => {
    if (!isConnected || !address || snapshotTimeRef.current === null) return;

    const intervalId = window.setInterval(() => {
      const snapshotTime = snapshotTimeRef.current;
      if (!snapshotTime) return;

      const elapsedSeconds = Math.max(
        0,
        Math.floor((Date.now() - snapshotTime) / 1000),
      );
      const accrued =
        snapshotSavingsRef.current * SAVINGS_PER_SECOND_RATE * elapsedSeconds;
      setDisplayAvailableInterest(baseAvailableRef.current + accrued);
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isConnected, address]);

  const refresh = useCallback(async () => {
    await refetchContracts();
  }, [refetchContracts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => {
      void refresh();
    };
    window.addEventListener("onchain-balance-refresh", handleRefresh);
    return () =>
      window.removeEventListener("onchain-balance-refresh", handleRefresh);
  }, [refresh]);

  const notImplementedAction = async () => {
    throw new Error("Not implemented yet");
  };

  return {
    balances: {
      wallet: walletBalance,
      savings: savingsBalance,
    },
    interest: {
      available: displayAvailableInterest,
    },
    actions: {
      refresh,
      deposit: notImplementedAction,
      withdraw: notImplementedAction,
      collect: notImplementedAction,
    },
    status: {
      isConnected,
      isLoading: isLoading || isFetching,
      error: error?.message ?? null,
    },
  };
}
