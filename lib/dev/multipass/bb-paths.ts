import "server-only";

import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

/** Package root for @aztec/bb.js (works under pnpm and Vercel traced output). */
export function bbJsPackageRoot(): string {
	const entry = require.resolve("@aztec/bb.js");
	const segment = path.basename(path.dirname(entry));
	if (segment === "node" || segment === "node-cjs") {
		return path.dirname(path.dirname(path.dirname(entry)));
	}
	throw new Error(`Unexpected @aztec/bb.js entry path: ${entry}`);
}

export type BbJsAssetPaths = {
	wasmThreadsGz: string;
	bbBinary: string | null;
	napiModule: string | null;
};

function nativeBuildDir(root: string): string | null {
	const arch = process.arch === "arm64" ? "arm64" : "amd64";
	if (process.platform === "linux") {
		return path.join(root, `build/${arch}-linux`);
	}
	if (process.platform === "darwin") {
		return path.join(root, `build/${arch}-macos`);
	}
	return null;
}

export function resolveBbJsAssetPaths(): BbJsAssetPaths {
	const root = bbJsPackageRoot();
	const wasmThreadsGz = path.join(
		root,
		"dest/node/barretenberg_wasm/barretenberg-threads.wasm.gz",
	);
	const buildDir = nativeBuildDir(root);
	const bbBinary = buildDir ? path.join(buildDir, "bb") : "";
	const napiModule = buildDir ? path.join(buildDir, "nodejs_module.node") : "";
	return {
		wasmThreadsGz,
		bbBinary: bbBinary && existsSync(bbBinary) ? bbBinary : null,
		napiModule: napiModule && existsSync(napiModule) ? napiModule : null,
	};
}
