"use client";

import { useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
	useConnection,
	usePublicClient,
	useReadContracts,
	useSwitchChain,
	useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";

const WDD_TOKEN_ADDRESS = "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B" as const;
const BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS =
	"0xeFE5a120c2787ee53FbebAE8902bdDe1edE416Fc" as const;
const WDD_DECIMALS = 18;
// Match on-chain linear savings growth: balance doubles in 529 days.
const SECONDS_IN_529_DAYS = 529 * 86400;
const SAVINGS_PER_SECOND_RATE = 1 / SECONDS_IN_529_DAYS;
const BALANCE_SYNC_TOLERANCE = 1e-6;

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
		name: "allowance",
		stateMutability: "view",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ name: "", type: "uint256" }],
	},
	{
		type: "function",
		name: "approve",
		stateMutability: "nonpayable",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
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
	{
		type: "function",
		name: "stake",
		stateMutability: "nonpayable",
		inputs: [{ name: "amount", type: "uint256" }],
		outputs: [],
	},
	{
		type: "function",
		name: "withdraw",
		stateMutability: "nonpayable",
		inputs: [{ name: "amount", type: "uint256" }],
		outputs: [],
	},
	{
		type: "function",
		name: "redeem",
		stateMutability: "nonpayable",
		inputs: [],
		outputs: [],
	},
] as const;

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

export function useBaseChainSavingsAccount() {
	const { toast } = useToast();
	const { address, isConnected, connector } = useConnection();
	const switchChain = useSwitchChain();
	const publicClient = usePublicClient({ chainId: base.id });
	const writeContract = useWriteContract();
	const [displayAvailableInterest, setDisplayAvailableInterest] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [optimisticAvailableInterest, setOptimisticAvailableInterest] =
		useState<number | null>(null);
	const [optimisticBalances, setOptimisticBalances] = useState<{
		wallet: number;
		savings: number;
		available: number;
	} | null>(null);
	const displayAvailableInterestRef = useRef(0);
	const snapshotTimeRef = useRef<number | null>(null);
	const snapshotSavingsRef = useRef(0);
	const snapshotAvailableRef = useRef(0);

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
				chainId: base.id,
			},
			{
				address: BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS,
				abi: tokenStakingPerTokenAbi,
				functionName: "balanceOf",
				args: address ? [address] : undefined,
				chainId: base.id,
			},
			{
				address: BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS,
				abi: tokenStakingPerTokenAbi,
				functionName: "available",
				args: address ? [address] : undefined,
				chainId: base.id,
			},
		],
		query: {
			enabled: Boolean(address),
		},
	});

	const hasConnectedAddress = isConnected && Boolean(address);
	const walletBalance = hasConnectedAddress
		? data?.[0]?.result !== undefined
			? Number(formatUnits(data[0].result as bigint, WDD_DECIMALS))
			: 0
		: 0;
	const savingsBalance = hasConnectedAddress
		? data?.[1]?.result !== undefined
			? Number(formatUnits(data[1].result as bigint, WDD_DECIMALS))
			: 0
		: 0;
	const availableInterest = hasConnectedAddress
		? data?.[2]?.result !== undefined
			? Number(formatUnits(data[2].result as bigint, WDD_DECIMALS))
			: 0
		: 0;
	const effectiveWalletBalance = optimisticBalances?.wallet ?? walletBalance;
	const effectiveSavingsBalance = optimisticBalances?.savings ?? savingsBalance;
	const effectiveAvailableInterest =
		optimisticAvailableInterest ??
		optimisticBalances?.available ??
		availableInterest;

	useEffect(() => {
		displayAvailableInterestRef.current = displayAvailableInterest;
	}, [displayAvailableInterest]);

	useEffect(() => {
		if (!isConnected || !address) {
			snapshotTimeRef.current = null;
			snapshotSavingsRef.current = 0;
			snapshotAvailableRef.current = 0;
			setDisplayAvailableInterest(0);
			setOptimisticAvailableInterest(null);
			setOptimisticBalances(null);
			return;
		}

		snapshotTimeRef.current = Date.now();
		snapshotSavingsRef.current = effectiveSavingsBalance;
		snapshotAvailableRef.current = effectiveAvailableInterest;
		setDisplayAvailableInterest(effectiveAvailableInterest);
	}, [
		isConnected,
		address,
		effectiveSavingsBalance,
		effectiveAvailableInterest,
	]);

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
			setDisplayAvailableInterest(snapshotAvailableRef.current + accrued);
		}, 1000);

		return () => window.clearInterval(intervalId);
	}, [isConnected, address]);

	const refresh = useCallback(async () => {
		await refetchContracts();
	}, [refetchContracts]);

	const refreshWithRetries = useCallback(
		async (attempts: number = 3, delayMs: number = 1200) => {
			for (let attempt = 0; attempt < attempts; attempt++) {
				await refresh();
				if (attempt < attempts - 1) {
					await new Promise((resolve) => window.setTimeout(resolve, delayMs));
				}
			}
		},
		[refresh],
	);

	useEffect(() => {
		if (!optimisticBalances) return;

		const walletSynced =
			Math.abs(walletBalance - optimisticBalances.wallet) <=
			BALANCE_SYNC_TOLERANCE;
		const savingsSynced =
			Math.abs(savingsBalance - optimisticBalances.savings) <=
			BALANCE_SYNC_TOLERANCE;

		if (walletSynced && savingsSynced) {
			setOptimisticBalances(null);
		}
	}, [walletBalance, savingsBalance, optimisticBalances]);

	const getLiveChainId = useCallback(async (): Promise<number | null> => {
		if (!connector) return null;
		try {
			const provider = (await connector.getProvider()) as EthereumProvider;
			const rawChainId = await provider.request({ method: "eth_chainId" });
			return parseHexChainId(rawChainId);
		} catch {
			return null;
		}
	}, [connector]);

	const ensureReadyForWrite = useCallback(async () => {
		if (!isConnected || !address) {
			throw new Error("Wallet not connected");
		}

		const preflightChainId = await getLiveChainId();
		if (preflightChainId !== base.id) {
			try {
				await switchChain.mutateAsync({ chainId: base.id });
			} catch {
				toast.error({ title: "Please switch to Base Chain to continue." });
				throw new Error("Chain switch failed");
			}
		}

		const postSwitchChainId = await getLiveChainId();
		if (postSwitchChainId !== base.id) {
			toast.error({ title: "Please switch to Base Chain to continue." });
			throw new Error("Chain switch failed");
		}

		if (!publicClient) {
			throw new Error("Base Chain client not available");
		}
		return { account: address as `0x${string}`, client: publicClient };
	}, [isConnected, address, getLiveChainId, switchChain, toast, publicClient]);

	const waitForSuccessReceipt = useCallback(
		async (hash: `0x${string}`, client: NonNullable<typeof publicClient>) => {
			const receipt = await client.waitForTransactionReceipt({ hash });
			if (receipt.status !== "success") {
				throw new Error("Transaction failed");
			}
		},
		[],
	);

	const deposit = useCallback(
		async (amount: string | number) => {
			const normalizedAmount = String(amount).trim();
			if (!normalizedAmount || Number(normalizedAmount) <= 0) {
				throw new Error("Invalid amount");
			}

			const amountWei = parseUnits(normalizedAmount, WDD_DECIMALS);
			setIsSubmitting(true);
			try {
				const { account, client } = await ensureReadyForWrite();
				const allowance = (await client.readContract({
					address: WDD_TOKEN_ADDRESS,
					abi: erc20Abi,
					functionName: "allowance",
					args: [account, BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS],
				})) as bigint;

				if (allowance < amountWei) {
					const approveHash = (await writeContract.mutateAsync({
						address: WDD_TOKEN_ADDRESS,
						abi: erc20Abi,
						functionName: "approve",
						args: [BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS, amountWei],
					})) as `0x${string}`;
					await waitForSuccessReceipt(approveHash, client);
				}

				const stakeHash = (await writeContract.mutateAsync({
					address: BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS,
					abi: tokenStakingPerTokenAbi,
					functionName: "stake",
					args: [amountWei],
				})) as `0x${string}`;
				await waitForSuccessReceipt(stakeHash, client);
				const amountValue = Number(normalizedAmount);
				setOptimisticBalances((current) => {
					const snapshotAvailable =
						optimisticAvailableInterest ??
						current?.available ??
						displayAvailableInterestRef.current;
					const prev = current ?? {
						wallet: walletBalance,
						savings: savingsBalance,
						available: snapshotAvailable,
					};
					return {
						wallet: Math.max(0, prev.wallet - amountValue),
						savings: prev.savings + amountValue,
						available: prev.available,
					};
				});
				setOptimisticAvailableInterest(
					(current) => current ?? displayAvailableInterestRef.current,
				);
				await refreshWithRetries();
				if (typeof window !== "undefined") {
					window.dispatchEvent(new Event("onchain-balance-refresh"));
				}
				return stakeHash;
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			ensureReadyForWrite,
			writeContract,
			waitForSuccessReceipt,
			refreshWithRetries,
			optimisticAvailableInterest,
			walletBalance,
			savingsBalance,
		],
	);

	const withdraw = useCallback(
		async (amount: string | number) => {
			const normalizedAmount = String(amount).trim();
			if (!normalizedAmount || Number(normalizedAmount) <= 0) {
				throw new Error("Invalid amount");
			}

			const amountWei = parseUnits(normalizedAmount, WDD_DECIMALS);
			setIsSubmitting(true);
			try {
				const { client } = await ensureReadyForWrite();
				const withdrawHash = (await writeContract.mutateAsync({
					address: BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS,
					abi: tokenStakingPerTokenAbi,
					functionName: "withdraw",
					args: [amountWei],
				})) as `0x${string}`;
				await waitForSuccessReceipt(withdrawHash, client);
				const amountValue = Number(normalizedAmount);
				setOptimisticBalances((current) => {
					const snapshotAvailable =
						optimisticAvailableInterest ??
						current?.available ??
						displayAvailableInterestRef.current;
					const prev = current ?? {
						wallet: walletBalance,
						savings: savingsBalance,
						available: snapshotAvailable,
					};
					return {
						wallet: prev.wallet + amountValue,
						savings: Math.max(0, prev.savings - amountValue),
						available: prev.available,
					};
				});
				setOptimisticAvailableInterest(
					(current) => current ?? displayAvailableInterestRef.current,
				);
				await refreshWithRetries();
				if (typeof window !== "undefined") {
					window.dispatchEvent(new Event("onchain-balance-refresh"));
				}
				return withdrawHash;
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			ensureReadyForWrite,
			writeContract,
			waitForSuccessReceipt,
			refreshWithRetries,
			optimisticAvailableInterest,
			walletBalance,
			savingsBalance,
		],
	);

	const collect = useCallback(async () => {
		setIsSubmitting(true);
		try {
			const { client } = await ensureReadyForWrite();
			const redeemHash = (await writeContract.mutateAsync({
				address: BASE_CHAIN_SAVINGS_CONTRACT_ADDRESS,
				abi: tokenStakingPerTokenAbi,
				functionName: "redeem",
				args: [],
			})) as `0x${string}`;
			await waitForSuccessReceipt(redeemHash, client);
			setOptimisticBalances((current) => {
				const snapshotAvailable =
					optimisticAvailableInterest ??
					current?.available ??
					displayAvailableInterestRef.current;
				const prev = current ?? {
					wallet: walletBalance,
					savings: savingsBalance,
					available: snapshotAvailable,
				};
				return {
					wallet: prev.wallet + prev.available,
					savings: prev.savings,
					available: 0,
				};
			});
			setOptimisticAvailableInterest(0);
			await refreshWithRetries();
			if (typeof window !== "undefined") {
				window.dispatchEvent(new Event("onchain-balance-refresh"));
			}
			return redeemHash;
		} finally {
			setIsSubmitting(false);
		}
	}, [
		ensureReadyForWrite,
		writeContract,
		waitForSuccessReceipt,
		refreshWithRetries,
		optimisticAvailableInterest,
		walletBalance,
		savingsBalance,
	]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const handleRefresh = () => {
			void refresh();
		};
		window.addEventListener("onchain-balance-refresh", handleRefresh);
		return () =>
			window.removeEventListener("onchain-balance-refresh", handleRefresh);
	}, [refresh]);

	return {
		balances: {
			wallet: effectiveWalletBalance,
			savings: effectiveSavingsBalance,
		},
		interest: {
			available: displayAvailableInterest,
		},
		actions: {
			refresh,
			deposit,
			withdraw,
			collect,
		},
		status: {
			isConnected,
			isLoading: isLoading || isFetching || isSubmitting,
			isSubmitting,
			error: error?.message ?? null,
		},
	};
}
