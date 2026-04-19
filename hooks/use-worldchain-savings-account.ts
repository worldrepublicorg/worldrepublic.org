"use client";

import { formatUnits } from "viem";
import { useAccount, useReadContracts } from "wagmi";

const WORLD_CHAIN_ID = 480;
const WDD_TOKEN_ADDRESS = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" as const;
const WORLD_SAVINGS_CONTRACT_ADDRESS =
  "0x234302Db10A54BDc11094A8Ef816B0Eaa5FCE3f7" as const;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
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

  const { data, isLoading, isFetching } = useReadContracts({
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
      {
        address: WDD_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "decimals",
        chainId: WORLD_CHAIN_ID,
      },
    ],
    query: {
      enabled: Boolean(address),
    },
  });

  const decimals = Number(data?.[3]?.result ?? 18);
  const walletBalance =
    data?.[0]?.result !== undefined
      ? Number(formatUnits(data[0].result as bigint, decimals))
      : 0;
  const savingsBalance =
    data?.[1]?.result !== undefined
      ? Number(formatUnits(data[1].result as bigint, decimals))
      : 0;
  const availableInterest =
    data?.[2]?.result !== undefined
      ? Number(formatUnits(data[2].result as bigint, decimals))
      : 0;

  return {
    walletBalance,
    savingsBalance,
    availableInterest,
    isConnected,
    isLoading: isLoading || isFetching,
  };
}
