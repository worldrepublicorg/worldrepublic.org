import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getBrandingForHost } from "@/lib/branding";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const requestHeaders = await headers();
	const host =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const branding = getBrandingForHost(host);

	return {
		name: branding.appName,
		short_name: branding.appName,
		description: branding.description,
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/icons/apple-touch-icon.png",
				sizes: "180x180",
				type: "image/png",
			},
			{
				src: "/icons/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/icons/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	};
}
