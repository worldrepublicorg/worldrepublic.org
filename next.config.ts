import type { NextConfig } from "next";
import { locales } from "./lib/locales";

const localePattern = locales.join("|");

const nextConfig: NextConfig = {
	transpilePackages: ["@selfxyz/core", "@selfxyz/qrcode"],
	reactCompiler: true,
	// Enables Partial Prerendering (PPR) and the `"use cache"` directive.
	// Routes are statically prerendered by default; dynamic data must live inside
	// a Suspense boundary (or a runtime API call like cookies()/headers() opts the
	// route out automatically).
	cacheComponents: true,
	async redirects() {
		return [
			{
				source: `/:lang(${localePattern})/earn`,
				destination: "/:lang",
				permanent: true,
			},
			{
				source: `/:lang(${localePattern})/parties`,
				destination: "/:lang/govern?tab=parties",
				permanent: true,
			},
			{
				source: `/:lang(${localePattern})/parties/:id`,
				destination: "/:lang/govern/parties/:id",
				permanent: true,
			},
			{
				source: `/:lang(${localePattern})/parties/:id/:path*`,
				destination: "/:lang/govern/parties/:id/:path*",
				permanent: true,
			},
			{
				source: `/:lang(${localePattern})/vote/elections`,
				destination: "/:lang/govern/elections",
				permanent: true,
			},
			{
				source: `/:lang(${localePattern})/vote/elections/:path*`,
				destination: "/:lang/govern/elections/:path*",
				permanent: true,
			},
		];
	},
};

export default nextConfig;
