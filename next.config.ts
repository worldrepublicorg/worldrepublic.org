import type { NextConfig } from "next";
import { locales } from "./lib/locales";

const localePattern = locales.join("|");

const proveInnerRoute = "/api/dev/multipass/api/proofs/prove-inner";

const nextConfig: NextConfig = {
	transpilePackages: ["@selfxyz/core", "@selfxyz/qrcode"],
	reactCompiler: true,
	// Barretenberg: native bb binary + WASM fallbacks must ship with the prove-inner lambda.
	serverExternalPackages: ["@aztec/bb.js", "pako"],
	outputFileTracingIncludes: {
		[proveInnerRoute]: [
			"./node_modules/@aztec/bb.js/build/**/*",
			"./node_modules/@aztec/bb.js/dest/node/barretenberg_wasm/**/*",
		],
	},
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
