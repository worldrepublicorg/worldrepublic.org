"use client";

import { startRegistration } from "@simplewebauthn/browser";
import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
	Button,
	Input,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import {
	PiCaretLeft,
	PiCircleNotch,
	PiLinkSimple,
	PiPencilSimple,
	PiPencilSimpleFill,
	PiPlus,
	PiShareNetwork,
	PiTrash,
	PiTrashFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { AccountPageSkeleton } from "@/components/menu/account/account-page-skeleton";
import { AccountVerificationSection } from "@/components/menu/account-verification-section";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import { useWalletAuthCache } from "@/hooks/use-wallet-auth-cache";
import {
	deleteUserAccount,
	getWalletAuthAndData,
	setUsername,
} from "@/lib/actions/member";
import {
	getPasskeyRegistrationOptions,
	linkPasskeyToAccount,
	setLinkingIntent,
} from "@/lib/actions/passkey";
import { CANONICAL_SHARE_ORIGIN } from "@/lib/branding";
import { copyToClipboard } from "@/lib/utils";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";

interface AccountPageClientProps {
	lang: string;
	dictionary: Dictionary;
}

export default function AccountPageClient({
	lang,
	dictionary,
}: AccountPageClientProps) {
	const { signOut } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const toastRef = useRef(toast);
	toastRef.current = toast;
	const { isAuthenticated: clientIsAuthenticated } = useAuth();

	const cachedData = useWalletAuthCache();
	const [serverData, setServerData] = useState<Awaited<
		ReturnType<typeof getWalletAuthAndData>
	> | null>(null);

	const hasHandledLink = useRef(false);

	useEffect(() => {
		const link = searchParams.get("link");
		const error = searchParams.get("error");
		if (link !== "google" || hasHandledLink.current) return;
		hasHandledLink.current = true;

		if (
			error === "account_already_linked" ||
			error === "OAuthAccountNotLinked"
		) {
			toastRef.current.error({
				title: dictionary.toasts.wallet.google_already_linked,
			});
		} else {
			toastRef.current.success({
				title: dictionary.toasts.wallet.google_linked,
			});
		}

		router.replace(`/${lang}/menu/account`);
	}, [
		lang,
		router,
		searchParams,
		dictionary.toasts.wallet.google_already_linked,
		dictionary.toasts.wallet.google_linked,
	]);

	useEffect(() => {
		let cancelled = false;
		const pendingReferral =
			localStorage.getItem("pending_referral") || undefined;
		getWalletAuthAndData(pendingReferral).then((result) => {
			if (cancelled) return;
			setServerData(result);
			setCachedWalletData(result);
			if (pendingReferral && result.authenticated) {
				localStorage.removeItem("pending_referral");
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const data = serverData ?? cachedData;
	const showSkeleton = data === null;
	const username = data?.profileData?.username ?? null;
	const referralCode = data?.profileData?.referralCode ?? null;
	const referredByUsername = data?.profileData?.referredByUsername ?? null;
	const isAuthenticated = data?.authenticated ?? false;
	const authenticated = isAuthenticated || clientIsAuthenticated;
	const userUuid = data?.profileData?.userUuid ?? null;
	const isSelfVerified = Boolean(data?.profileData?.selfVerifiedAt);
	const linkedProviders = data?.linkedProviders ?? null;
	const googleLinked = linkedProviders?.hasGoogle ?? false;
	const passkeyCount = linkedProviders?.passkeyCount ?? 0;

	// State for form validation
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);
	const [editUsernameDialogOpen, setEditUsernameDialogOpen] = useState(false);
	const [editUsernameValue, setEditUsernameValue] = useState("");
	const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
	const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
	const [isAddingPasskey, setIsAddingPasskey] = useState(false);

	const handleSignOut = async () => {
		try {
			await signOut();
			window.location.href = `/${lang}/`;
		} catch (error) {
			console.error("Error signing out:", error);
			toast.error({
				title: dictionary.toasts.wallet.sign_out_failed,
			});
			window.location.href = `/${lang}/`;
		}
	};

	const handleDeleteAccount = async () => {
		if (!userUuid) {
			toast.error({
				title: dictionary.toasts.wallet.no_wallet,
			});
			return;
		}

		setIsDeletingAccount(true);

		try {
			const result = await deleteUserAccount(userUuid);

			if (result.success) {
				toast.success({
					title: dictionary.toasts.wallet.account_deleted,
				});
				await handleSignOut();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.wallet.delete_failed,
				});
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			toast.error({
				title: dictionary.toasts.wallet.delete_failed,
			});
		} finally {
			setIsDeletingAccount(false);
		}
	};

	const handleShareReferralLink = async () => {
		let code = referralCode;
		if (!code) {
			try {
				const result = await getWalletAuthAndData();
				if (result.profileData?.referralCode) {
					code = result.profileData.referralCode;
					setServerData(result);
					setCachedWalletData(result);
				}
			} catch {
				// Ignore; we'll handle the "no code" case below
			}
		}
		if (!code) {
			toast.error({
				title: dictionary.toasts.generic_error,
			});
			return;
		}
		const link = `${CANONICAL_SHARE_ORIGIN}/?ref=${code}`;
		if (navigator.share) {
			try {
				await navigator.share({ url: link });
			} catch (error) {
				if (error instanceof Error && error.name !== "AbortError") {
					await copyToClipboard(link, toast, {
						success: dictionary.toasts.copied,
						error: dictionary.toasts.generic_error,
					});
				}
			}
		} else {
			await copyToClipboard(link, toast, {
				success: dictionary.toasts.copied,
				error: dictionary.toasts.generic_error,
			});
		}
	};

	const handleUsernameSave = async () => {
		setIsUpdatingUsername(true);
		try {
			const result = await setUsername(editUsernameValue.trim());
			if (result.success) {
				toast.success({
					title: dictionary.toasts.parties.updated,
				});
				setEditUsernameDialogOpen(false);
				setEditUsernameValue("");
				const fresh = await getWalletAuthAndData();
				setServerData(fresh);
				setCachedWalletData(fresh);
				router.refresh();
			} else {
				toast.error({
					title: result.error || dictionary.toasts.parties.update_failed,
				});
			}
		} catch (error) {
			console.error("Error updating username:", error);
			toast.error({
				title: dictionary.toasts.parties.update_failed,
			});
		} finally {
			setIsUpdatingUsername(false);
		}
	};

	const handleLinkGoogle = async () => {
		try {
			setIsLinkingGoogle(true);
			await setLinkingIntent();
			await signIn("google", {
				callbackUrl: `/${lang}/menu/account?link=google`,
			});
		} catch (error) {
			console.error("Error linking Google account:", error);
			toast.error({
				title: dictionary.toasts.wallet.google_link_failed,
			});
			setIsLinkingGoogle(false);
		}
	};

	const handleAddPasskey = async () => {
		setIsAddingPasskey(true);
		try {
			const optionsResult = await getPasskeyRegistrationOptions(
				null,
				username || undefined,
			);

			if (optionsResult.error) {
				throw new Error(
					optionsResult.error || "Failed to get registration options",
				);
			}

			if (!("challenge" in optionsResult)) {
				throw new Error("Invalid registration options");
			}

			const { challenge, tempUserId } = optionsResult;
			let registrationResponse: Awaited<ReturnType<typeof startRegistration>>;
			try {
				registrationResponse = await startRegistration(optionsResult);
			} catch (error) {
				if (
					error instanceof Error &&
					(error.name === "NotAllowedError" ||
						error.name === "AbortError" ||
						error.message.includes("cancel") ||
						error.message.includes("abort"))
				) {
					setIsAddingPasskey(false);
					return;
				}
				throw error;
			}

			const verifyResult = await linkPasskeyToAccount(
				registrationResponse,
				challenge,
				tempUserId,
			);

			if (verifyResult.error) {
				throw new Error(verifyResult.error || "Failed to link passkey");
			}

			if (verifyResult.verified) {
				toast.success({
					title: dictionary.toasts.wallet.passkey_added,
				});
				const fresh = await getWalletAuthAndData();
				setServerData(fresh);
				setCachedWalletData(fresh);
				router.refresh();
			}
		} catch (error) {
			console.error("Error adding passkey:", error);
			toast.error({
				title:
					error instanceof Error
						? error.message
						: dictionary.toasts.wallet.passkey_add_failed,
			});
		} finally {
			setIsAddingPasskey(false);
		}
	};

	if (showSkeleton) {
		return <AccountPageSkeleton />;
	}

	return (
		<div className="pb-safe flex flex-col">
			{!authenticated ? (
				<TopBar
					title={dictionary.pages.menu.sections.account.account_info}
					startAdornment={
						<button
							type="button"
							onClick={() => router.push(`/${lang}/menu`)}
							className="flex size-10 items-center justify-center rounded-full bg-gray-100"
						>
							<PiCaretLeft className="size-4 text-gray-900" />
						</button>
					}
				/>
			) : (
				<>
					<TopBar
						title={dictionary.pages.menu.sections.account.account_info}
						startAdornment={
							<button
								type="button"
								onClick={() => router.push(`/${lang}/menu`)}
								className="flex size-10 items-center justify-center rounded-full bg-gray-100"
							>
								<PiCaretLeft className="size-4 text-gray-900" />
							</button>
						}
					/>

					<div className="flex flex-col gap-8 p-6">
						<div>
							<div className="mb-4 flex">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-400"
								>
									{dictionary.pages.wallet.sections.account}
								</Typography>
							</div>
							<div className="flex flex-col gap-2">
								{username && (
									<CustomListItem
										label={dictionary.pages.wallet.username.label}
										description={username}
										endAdornment={
											<PiPencilSimple className="size-4 text-gray-400" />
										}
										onClick={(e) => {
											e.stopPropagation();
											setEditUsernameValue(username);
											setEditUsernameDialogOpen(true);
										}}
									/>
								)}
								<CustomListItem
									label={dictionary.pages.menu.sections.account.referral_code}
									description={referralCode ?? ""}
									endAdornment={
										<PiShareNetwork className="size-4 text-gray-400" />
									}
									onClick={(e) => {
										e.stopPropagation();
										void handleShareReferralLink();
									}}
								/>
								{referredByUsername && (
									<div>
										<CustomListItem
											label={dictionary.pages.menu.sections.account.referred_by}
											description={referredByUsername}
											noPointer
										/>
									</div>
								)}
							</div>
						</div>

						<AccountVerificationSection
							dictionary={dictionary}
							authenticated={authenticated}
							userId={userUuid}
							isSelfVerified={isSelfVerified}
							onSuccess={async () => {
								const fresh = await getWalletAuthAndData();
								setServerData(fresh);
								setCachedWalletData(fresh);
								router.refresh();
							}}
						/>

						<div>
							<div className="mb-4 flex">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-400"
								>
									{dictionary.pages.wallet.sections.security}
								</Typography>
							</div>
							<div className="flex flex-col gap-2">
								{googleLinked ? (
									<div>
										<CustomListItem
											label={dictionary.pages.wallet.sections.google_account}
											description={
												dictionary.pages.wallet.sections.google_linked
											}
											noPointer
										/>
									</div>
								) : (
									<CustomListItem
										label={dictionary.pages.wallet.sections.google_account}
										description={
											dictionary.pages.wallet.sections.google_not_linked
										}
										endAdornment={
											<div className="flex items-center text-gray-500">
												{isLinkingGoogle ? (
													<PiCircleNotch className="size-4 animate-spin" />
												) : (
													<PiLinkSimple className="size-4" />
												)}
											</div>
										}
										onClick={(e) => {
											e.stopPropagation();
											if (!isLinkingGoogle) {
												void handleLinkGoogle();
											}
										}}
									/>
								)}
								<CustomListItem
									label={dictionary.pages.wallet.sections.passkeys}
									description={dictionary.pages.wallet.sections.passkeys_linked.replace(
										"{count}",
										String(passkeyCount),
									)}
									endAdornment={
										<div className="flex items-center text-gray-500">
											{isAddingPasskey ? (
												<PiCircleNotch className="size-4 animate-spin" />
											) : (
												<PiPlus className="size-4" />
											)}
										</div>
									}
									onClick={(e) => {
										e.stopPropagation();
										if (!isAddingPasskey) {
											void handleAddPasskey();
										}
									}}
								/>
							</div>
						</div>

						<div>
							<div className="mb-4 flex">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-400"
								>
									{dictionary.pages.wallet.sections.danger_zone}
								</Typography>
							</div>
							<div className="flex flex-col gap-2">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<CustomListItem
											label={dictionary.common.delete_account}
											description={
												dictionary.pages.wallet.sections.delete_account
													.description
											}
											endAdornment={
												<PiTrash className="size-4 text-gray-400" />
											}
										/>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader
											icon={
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
													<PiTrashFill className="h-[30px] w-[30px] text-gray-400" />
												</div>
											}
										>
											<Typography variant="heading" level={3}>
												{dictionary.common.delete_account}
											</Typography>
										</AlertDialogHeader>

										<AlertDialogDescription>
											{
												dictionary.pages.wallet.modals.delete_account
													.description
											}
										</AlertDialogDescription>

										<AlertDialogFooter>
											<AlertDialogClose asChild>
												<Button
													onClick={handleDeleteAccount}
													disabled={isDeletingAccount}
													className="w-full bg-red-500! text-white!"
												>
													{isDeletingAccount
														? dictionary.pages.wallet.modals.delete_account
																.deleting
														: dictionary.common.delete_account}
												</Button>
											</AlertDialogClose>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					</div>
				</>
			)}

			{/* Edit Username Dialog */}
			<AlertDialog
				open={editUsernameDialogOpen}
				onOpenChange={setEditUsernameDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader
						icon={
							<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
								<PiPencilSimpleFill className="h-[30px] w-[30px] text-gray-400" />
							</div>
						}
					>
						<Typography variant="heading" level={3}>
							{dictionary.pages.wallet.username.edit_title}
						</Typography>
					</AlertDialogHeader>
					<AlertDialogDescription>
						<div className="space-y-4">
							<div>
								<Input
									label={dictionary.pages.wallet.username.label}
									value={editUsernameValue}
									onChange={(e) => setEditUsernameValue(e.target.value)}
									disabled={isUpdatingUsername}
								/>
								<Typography
									variant="body"
									level={4}
									className="mt-1! text-gray-500"
								>
									{dictionary.pages.wallet.username.description}
								</Typography>
							</div>
						</div>
					</AlertDialogDescription>
					<AlertDialogFooter>
						<Button
							onClick={handleUsernameSave}
							disabled={isUpdatingUsername || !editUsernameValue.trim()}
						>
							{isUpdatingUsername
								? dictionary.common.updating
								: dictionary.common.save}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
