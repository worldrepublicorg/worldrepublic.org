"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import {
	PiArrowSquareOut,
	PiPower,
	PiPowerFill,
	PiWalletFill,
} from "react-icons/pi";
import type { Connector } from "wagmi";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { CustomListItem } from "@/components/custom-list-item";
import { useBaseChainSavingsAccount } from "@/hooks/use-base-chain-savings-account";
import {
	copyToClipboard,
	getBalancePrecision,
	truncateToPrecision,
} from "@/lib/utils";

interface ConnectWalletButtonProps {
	variant?: ComponentProps<typeof Button>["variant"];
	size?: ComponentProps<typeof Button>["size"];
	fullWidth?: boolean;
	className?: string;
	compact?: boolean;
	connectLabel?: string;
	disconnectLabel?: string;
	disconnectDescription?: string;
	walletBrowserDialogTitle?: string;
	walletBrowserDialogDescription?: string;
	walletBrowserDialogButtonLabel?: string;
	walletPickerDialogDescription?: string;
	noWalletDialogDescription?: string;
	noWalletDialogLinkLabel?: string;
	copiedToastTitle?: string;
	copyErrorToastTitle?: string;
	accountTitle?: string;
	lang?: string;
}

export function ConnectWalletButton({
	variant = "tertiary",
	size,
	fullWidth = false,
	className,
	compact = true,
	connectLabel = "Connect wallet",
	disconnectLabel = "Disconnect",
	disconnectDescription = "Are you sure you want to disconnect your wallet?",
	walletBrowserDialogTitle = "Open in wallet app",
	walletBrowserDialogDescription = "To connect, copy this link and open it in a wallet app's built-in browser.",
	walletBrowserDialogButtonLabel = "Copy link",
	walletPickerDialogDescription = "Multiple wallets were found. Select one to connect.",
	noWalletDialogDescription = "Haven't got a wallet?",
	noWalletDialogLinkLabel = "Find one on WalletGuide",
	copiedToastTitle = "Copied",
	copyErrorToastTitle = "An error occurred",
	accountTitle = "Account",
	lang = "en",
}: ConnectWalletButtonProps = {}) {
	const { status, connector } = useConnection();
	const isConnected = status === "connected";
	const { toast } = useToast();
	const connect = useConnect();
	const disconnect = useDisconnect();
	const connectors = useConnectors();
	const [walletBrowserDialogOpen, setWalletBrowserDialogOpen] = useState(false);
	const [walletPickerDialogOpen, setWalletPickerDialogOpen] = useState(false);
	const [noWalletDialogOpen, setNoWalletDialogOpen] = useState(false);
	const [baseAccountChooserDialogOpen, setBaseAccountChooserDialogOpen] =
		useState(false);
	const [availableDesktopConnectors, setAvailableDesktopConnectors] = useState<
		Connector[]
	>([]);
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
	const baseChainAccount = useBaseChainSavingsAccount();
	const rawBalance = baseChainAccount.balances.wallet;
	const precision = getBalancePrecision(rawBalance);
	const truncatedBalance = truncateToPrecision(rawBalance, precision);
	const finalPrecision = truncatedBalance === 0 ? 2 : precision;
	const locale = lang.trim() || "en";
	const displayBalance = truncatedBalance.toLocaleString(locale, {
		minimumFractionDigits: finalPrecision,
		maximumFractionDigits: finalPrecision,
	});
	const isBaseAccountConnected = isConnected && connector?.id === "baseAccount";
	const walletSavingsUrl =
		"https://www.worldrepublic.org/?tab=savings&savings_account=base_chain";

	const handleWalletButtonClick = async () => {
		const userAgent =
			typeof window === "undefined" ? "" : window.navigator.userAgent;
		const isMobileDevice =
			/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
				userAgent,
			);
		const connectorsWithProvider = (
			await Promise.all(
				connectors.map(async (connector) => {
					try {
						const provider = await connector.getProvider();
						return provider ? connector : null;
					} catch {
						return null;
					}
				}),
			)
		).filter((connector): connector is Connector => connector !== null);
		const baseAccountConnector =
			connectorsWithProvider.find(
				(connector) => connector.id === "baseAccount",
			) ?? null;
		const connectorsWithoutInjected = connectorsWithProvider.filter(
			(connector) => connector.id !== "injected",
		);
		const prioritizedConnectors =
			connectorsWithoutInjected.length > 0
				? connectorsWithoutInjected
				: connectorsWithProvider;

		// Mobile in-app wallet browsers can expose unstable injected providers.
		// Prefer Base Account only on mobile when available.
		if (isMobileDevice && baseAccountConnector) {
			connect.mutate({ connector: baseAccountConnector });
			return;
		}

		if (prioritizedConnectors.length > 0) {
			if (!isMobileDevice && prioritizedConnectors.length > 1) {
				setAvailableDesktopConnectors(prioritizedConnectors);
				setWalletPickerDialogOpen(true);
				return;
			}

			connect.mutate({ connector: prioritizedConnectors[0] });
			return;
		}

		if (isMobileDevice) {
			setWalletBrowserDialogOpen(true);
			return;
		}

		setNoWalletDialogOpen(true);
	};

	const handleCopyLink = async () => {
		const copied = await copyToClipboard(walletSavingsUrl, toast, {
			success: copiedToastTitle,
			error: copyErrorToastTitle,
		});

		if (copied) {
			setWalletBrowserDialogOpen(false);
		}
	};

	return (
		<>
			{isConnected ? (
				isBaseAccountConnected ? (
					<>
						<AlertDialog
							open={baseAccountChooserDialogOpen}
							onOpenChange={setBaseAccountChooserDialogOpen}
						>
							<AlertDialogTrigger asChild>
								<button
									type="button"
									className="flex h-10 cursor-pointer items-center rounded-full bg-gray-100 px-4"
								>
									<PiWalletFill className="mr-2 h-5 w-5 text-gray-900" />
									<Typography
										variant="number"
										level={5}
										className="mr-1! font-mono"
									>
										{displayBalance}
									</Typography>
								</button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>{accountTitle}</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<div className="flex w-full flex-col gap-2">
										<a
											href="https://account.base.app/"
											target="_blank"
											rel="noopener noreferrer"
											className="block w-full"
										>
											<CustomListItem
												label="Base Account"
												endAdornment={
													<PiArrowSquareOut className="size-4 text-gray-400" />
												}
											/>
										</a>
										<CustomListItem
											label={disconnectLabel}
											onClick={() => {
												setBaseAccountChooserDialogOpen(false);
												setDisconnectDialogOpen(true);
											}}
											endAdornment={
												<PiPower className="size-4 text-gray-400" />
											}
										/>
									</div>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
						<AlertDialog
							open={disconnectDialogOpen}
							onOpenChange={setDisconnectDialogOpen}
						>
							<AlertDialogContent>
								<AlertDialogHeader
									icon={
										<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
											<PiPowerFill className="h-[30px] w-[30px] text-gray-400" />
										</div>
									}
								>
									<AlertDialogTitle>{disconnectLabel}</AlertDialogTitle>
								</AlertDialogHeader>
								<AlertDialogDescription>
									{disconnectDescription}
								</AlertDialogDescription>
								<AlertDialogFooter>
									<Button
										variant="primary"
										fullWidth
										onClick={() => {
											disconnect.mutate();
											setDisconnectDialogOpen(false);
										}}
									>
										{disconnectLabel}
									</Button>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</>
				) : (
					<AlertDialog
						open={disconnectDialogOpen}
						onOpenChange={setDisconnectDialogOpen}
					>
						<AlertDialogTrigger asChild>
							<button
								type="button"
								className="flex h-10 cursor-pointer items-center rounded-full bg-gray-100 px-4"
							>
								<PiWalletFill className="mr-2 h-5 w-5 text-gray-900" />
								<Typography
									variant="number"
									level={5}
									className="mr-1! font-mono"
								>
									{displayBalance}
								</Typography>
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader
								icon={
									<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
										<PiPowerFill className="h-[30px] w-[30px] text-gray-400" />
									</div>
								}
							>
								<AlertDialogTitle>{disconnectLabel}</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogDescription>
								{disconnectDescription}
							</AlertDialogDescription>
							<AlertDialogFooter>
								<Button
									variant="primary"
									fullWidth
									onClick={() => {
										disconnect.mutate();
										setDisconnectDialogOpen(false);
									}}
								>
									{disconnectLabel}
								</Button>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				)
			) : (
				<Button
					variant={variant}
					size={size}
					onClick={() => void handleWalletButtonClick()}
					disabled={connect.isPending}
					fullWidth={fullWidth}
					className={`${compact ? "h-10 rounded-full px-4 text-sm font-semibold " : ""}${className ?? ""}`}
				>
					{connectLabel}
				</Button>
			)}

			<AlertDialog
				open={walletPickerDialogOpen}
				onOpenChange={setWalletPickerDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader
						icon={
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
								<PiWalletFill className="h-[30px] w-[30px] text-gray-400" />
							</div>
						}
					>
						<AlertDialogTitle>{connectLabel}</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						{walletPickerDialogDescription}
					</AlertDialogDescription>
					<div className="flex flex-col gap-2">
						{availableDesktopConnectors.map((connector) => (
							<Button
								key={connector.id}
								variant="tertiary"
								fullWidth
								disabled={connect.isPending}
								onClick={() => {
									connect.mutate({ connector });
									setWalletPickerDialogOpen(false);
								}}
							>
								{connector.name}
							</Button>
						))}
					</div>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={walletBrowserDialogOpen}
				onOpenChange={setWalletBrowserDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader
						icon={
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
								<PiWalletFill className="h-[30px] w-[30px] text-gray-400" />
							</div>
						}
					>
						<AlertDialogTitle>{walletBrowserDialogTitle}</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						{walletBrowserDialogDescription}
					</AlertDialogDescription>
					<AlertDialogFooter>
						<Button onClick={() => void handleCopyLink()} fullWidth>
							{walletBrowserDialogButtonLabel}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog
				open={noWalletDialogOpen}
				onOpenChange={setNoWalletDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader
						icon={
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
								<PiWalletFill className="h-[30px] w-[30px] text-gray-400" />
							</div>
						}
					>
						<AlertDialogTitle>{connectLabel}</AlertDialogTitle>
					</AlertDialogHeader>
					<AlertDialogDescription>
						{noWalletDialogDescription}
					</AlertDialogDescription>
					<AlertDialogFooter>
						<div className="flex w-full flex-col gap-2">
							<a
								href="https://walletguide.walletconnect.network/"
								target="_blank"
								rel="noopener noreferrer"
								className="block w-full"
							>
								<CustomListItem
									label={noWalletDialogLinkLabel}
									endAdornment={
										<PiArrowSquareOut className="size-4 text-gray-400" />
									}
								/>
							</a>
						</div>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
