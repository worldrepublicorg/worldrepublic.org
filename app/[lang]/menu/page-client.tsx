"use client";

import {
	AlertDialog,
	AlertDialogClose,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTrigger,
	Button,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
	PiArrowSquareOut,
	PiBookOpenText,
	PiFileText,
	PiGithubLogo,
	PiGlobe,
	PiLifebuoy,
	PiRocketLaunch,
	PiShieldCheck,
	PiSignIn,
	PiSignOut,
	PiSignOutFill,
	PiUserCircle,
	PiWallet,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { MenuPageSkeleton } from "@/components/menu/menu-page-skeleton";
import { SignInDialog } from "@/components/sign-in-dialog";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import { useWalletAuthCache } from "@/hooks/use-wallet-auth-cache";
import { getWalletAuthAndData } from "@/lib/actions/member";
import { setCachedWalletData } from "@/lib/wallet-auth-cache";

interface MenuPageClientProps {
	lang: string;
	dictionary: Dictionary;
}

export default function MenuPageClient({
	lang,
	dictionary,
}: MenuPageClientProps) {
	const { toast } = useToast();
	const { isAuthenticated: clientIsAuthenticated } = useAuth();
	const [showSignInDialog, setShowSignInDialog] = useState(false);

	const cachedData = useWalletAuthCache();
	const [serverAuth, setServerAuth] = useState<boolean | null>(null);

	useEffect(() => {
		let cancelled = false;
		const pendingReferral =
			localStorage.getItem("pending_referral") || undefined;
		getWalletAuthAndData(pendingReferral).then((result) => {
			if (cancelled) return;
			setServerAuth(result.authenticated);
			setCachedWalletData(result);
			if (pendingReferral && result.authenticated) {
				localStorage.removeItem("pending_referral");
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	const showSkeleton = serverAuth === null && cachedData === null;
	const isAuthenticated =
		(serverAuth ?? cachedData?.authenticated ?? false) || clientIsAuthenticated;

	const handleSignOut = async () => {
		try {
			setCachedWalletData({
				authenticated: false,
				profileData: null,
				transactions: null,
				streams: null,
				linkedProviders: null,
			});
			await nextAuthSignOut({
				redirect: false,
			});
			window.location.href = `/${lang}/`;
		} catch (error) {
			console.error("Error signing out:", error);
			toast.error({
				title: dictionary.toasts.wallet.sign_out_failed,
			});
			window.location.href = `/${lang}/`;
		}
	};

	const menuSections = [
		{
			id: "account",
			title: dictionary.pages.menu.sections.account.title,
			links: [
				...(isAuthenticated
					? [
							{
								label: dictionary.pages.menu.sections.account.account_info,
								url: "/menu/account",
								isExternal: false,
								startAdornment: (
									<PiUserCircle className="size-5 text-gray-400" />
								),
							},
						]
					: [
							{
								label: dictionary.common.sign_in,
								url: "#",
								isExternal: false,
								startAdornment: <PiSignIn className="size-5 text-gray-400" />,
								onClick: () => setShowSignInDialog(true),
							},
						]),
				{
					label: dictionary.pages.wallet.topbar.title,
					url: "/menu/wallet",
					isExternal: false,
					startAdornment: <PiWallet className="size-5 text-gray-400" />,
				},
				{
					label: dictionary.pages.menu.sections.account.language,
					url: "/menu/language",
					isExternal: false,
					startAdornment: <PiGlobe className="size-5 text-gray-400" />,
				},
			],
		},
		{
			id: "help",
			title: dictionary.pages.menu.sections.help.title,
			links: [
				{
					label: dictionary.pages.menu.sections.help.quickstart,
					url: "https://wiki.worldrepublic.org/quickstart",
					isExternal: true,
					startAdornment: <PiRocketLaunch className="size-5 text-gray-400" />,
				},
				{
					label: dictionary.pages.menu.sections.help.docs,
					url: "https://wiki.worldrepublic.org/",
					isExternal: true,
					startAdornment: <PiBookOpenText className="size-5 text-gray-400" />,
				},
				{
					label: dictionary.pages.menu.sections.help.help_center,
					url: "https://wiki.worldrepublic.org/help-center",
					isExternal: true,
					startAdornment: <PiLifebuoy className="size-5 text-gray-400" />,
				},
			],
		},
		{
			id: "source_code",
			title: dictionary.pages.menu.sections.source_code.title,
			links: [
				{
					label: "GitHub",
					url: "https://github.com/worldrepublicorg",
					isExternal: true,
					startAdornment: <PiGithubLogo className="size-5 text-gray-400" />,
				},
			],
		},
		{
			id: "legal",
			title: dictionary.pages.menu.sections.legal.title,
			links: [
				{
					label: dictionary.pages.menu.sections.legal.terms,
					url: `/menu/terms`,
					isExternal: false,
					startAdornment: <PiFileText className="size-5 text-gray-400" />,
				},
				{
					label: dictionary.pages.menu.sections.legal.privacy,
					url: `/menu/privacy`,
					isExternal: false,
					startAdornment: <PiShieldCheck className="size-5 text-gray-400" />,
				},
			],
		},
	];

	if (showSkeleton) {
		return <MenuPageSkeleton />;
	}

	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar title={dictionary.nav.menu} />

			<div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
				<div className="flex flex-col gap-8">
					{menuSections.map((section) => (
						<div key={section.id}>
							<div className="mb-4 flex">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-400"
								>
									{section.title}
								</Typography>
							</div>

							<div className="flex flex-col gap-2">
								{section.links.map((link) => (
									<div key={link.url} className="flex">
										{"onClick" in link && link.onClick ? (
											<CustomListItem
												startAdornment={link.startAdornment}
												label={link.label}
												onClick={link.onClick}
											/>
										) : link.isExternal ? (
											<a
												href={link.url}
												target="_blank"
												rel="noopener noreferrer"
												className="block w-full"
											>
												<CustomListItem
													startAdornment={link.startAdornment}
													label={link.label}
													endAdornment={
														<PiArrowSquareOut className="size-4 text-gray-400" />
													}
												/>
											</a>
										) : (
											<CustomListItem
												startAdornment={link.startAdornment}
												label={link.label}
												href={`/${lang}${link.url}`}
												onClick={() => {
													// Store the current page as the return URL for wallet flow
													localStorage.setItem(
														"walletReturnUrl",
														window.location.pathname,
													);
												}}
											/>
										)}
									</div>
								))}
							</div>
						</div>
					))}

					{isAuthenticated && (
						<div>
							<div className="mb-4 flex">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-400"
								>
									{dictionary.common.sign_out.toUpperCase()}
								</Typography>
							</div>
							<div className="flex flex-col gap-2">
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<CustomListItem
											label={dictionary.common.sign_out}
											startAdornment={
												<PiSignOut className="size-5 text-gray-400" />
											}
										/>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader
											icon={
												<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
													<PiSignOutFill className="h-[30px] w-[30px] text-gray-400" />
												</div>
											}
										>
											<Typography variant="heading" level={3}>
												{dictionary.common.sign_out}
											</Typography>
										</AlertDialogHeader>
										<AlertDialogDescription>
											{dictionary.pages.wallet.modals.sign_out.confirm}
										</AlertDialogDescription>
										<AlertDialogFooter>
											<AlertDialogClose asChild>
												<Button
													onClick={async () => {
														await handleSignOut();
													}}
													className="w-full"
												>
													{dictionary.common.sign_out}
												</Button>
											</AlertDialogClose>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Sign-in dialog */}
			<SignInDialog
				open={showSignInDialog}
				onOpenChange={setShowSignInDialog}
				dictionary={dictionary}
			/>
		</div>
	);
}
