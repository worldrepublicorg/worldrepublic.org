import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "./globals.css";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import { Toaster } from "@worldcoin/mini-apps-ui-kit-react";
import { Suspense } from "react";
import BottomNav from "@/components/bottom-nav";
import { ReferralCapture } from "@/components/referral-capture";
import { getBrandingForHost } from "@/lib/branding";
import { DOCUMENT_LANG_HEADER, defaultLocale, locales } from "@/lib/locales";
import { cn } from "@/lib/utils";

function resolveDocumentLang(requestHeaders: Headers): string {
	const value = requestHeaders.get(DOCUMENT_LANG_HEADER);
	if (value && (locales as readonly string[]).includes(value)) {
		return value;
	}
	return defaultLocale;
}

const rubik = localFont({
	src: "../public/fonts/Rubik.woff2",
	variable: "--font-rubik",
	display: "swap",
});

const twkLausanne = localFont({
	src: [
		{
			path: "../public/fonts/TWKLausanne-350.woff2",
			weight: "400",
		},
		{
			path: "../public/fonts/TWKLausanne-500.woff2",
			weight: "500",
		},
		{
			path: "../public/fonts/TWKLausanne-600.woff2",
			weight: "600",
		},
	],
	variable: "--font-sans",
	display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
	const requestHeaders = await headers();
	const host =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const branding = getBrandingForHost(host);

	return {
		metadataBase: new URL(branding.metadataBase),
		applicationName: branding.appName,
		title: {
			default: branding.appDefaultTitle,
			template: branding.appTitleTemplate,
		},
		description: branding.description,
		icons: {
			icon: "/icons/android-chrome-192x192.png",
			apple: "/icons/apple-touch-icon.png",
		},
		formatDetection: {
			telephone: false,
		},
		openGraph: {
			type: "website",
			siteName: branding.appName,
			url: branding.metadataBase,
			title: {
				default: branding.appDefaultTitle,
				template: branding.appTitleTemplate,
			},
			description: branding.description,
			images: [
				{
					url: "/icons/android-chrome-512x512.png",
					width: 512,
					height: 512,
					alt: branding.appName,
				},
			],
		},
		twitter: {
			card: "summary",
			title: {
				default: branding.appDefaultTitle,
				template: branding.appTitleTemplate,
			},
			description: branding.description,
		},
	};
}

export const viewport: Viewport = {
	themeColor: "#000000",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const requestHeaders = await headers();
	const htmlLang = resolveDocumentLang(requestHeaders);

	return (
		<html dir="ltr" lang={htmlLang}>
			<head>
				<meta name="format-detection" content="telephone=no" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
				/>
			</head>
			<body
				className={cn(
					rubik.variable,
					twkLausanne.variable,
					"relative min-h-screen antialiased",
				)}
			>
				<div
					aria-hidden
					className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(100%_60%_at_50%_0%,rgba(0,85,99,0.08),transparent)]"
				/>
				<div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-white ring-1 ring-gray-100">
					{children}
					<Toaster />
				</div>
				<Suspense>
					<ReferralCapture />
				</Suspense>
				<BottomNav />
			</body>
		</html>
	);
}
