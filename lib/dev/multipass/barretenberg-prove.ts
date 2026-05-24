import "server-only";

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BackendType, Barretenberg } from "@aztec/bb.js";
import { resolveBbJsAssetPaths } from "@/lib/dev/multipass/bb-paths";
import {
	registryBytecodeToProveBytes,
	witnessBytesForProve,
} from "@/lib/dev/multipass/witness-bytecode";

const PROVE_SETTINGS = {
	ipaAccumulation: false,
	oracleHashType: "poseidon2",
	disableZk: false,
	optimizedSolidityVerifier: false,
} as const;

let bbInit: Promise<Barretenberg> | null = null;

function crsPath(): string {
	return process.env.BB_CRS_PATH ?? path.join(os.tmpdir(), "bb-crs");
}

function bbLogger(msg: string): void {
	if (process.env.BB_DEBUG === "1") {
		console.info(`[bb] ${msg}`);
	}
}

function initOptions() {
	const assets = resolveBbJsAssetPaths();
	if (!existsSync(assets.wasmThreadsGz)) {
		throw new Error(
			`Barretenberg WASM missing at ${assets.wasmThreadsGz}. Ensure @aztec/bb.js assets are included in the server bundle.`,
		);
	}
	return {
		crsPath: crsPath(),
		threads: 1,
		wasmPath: assets.wasmThreadsGz,
		bbPath: assets.bbBinary ?? undefined,
		napiPath: assets.napiModule ?? undefined,
		logger: bbLogger,
	};
}

async function getBarretenberg(): Promise<Barretenberg> {
	if (!bbInit) {
		bbInit = (async () => {
			await mkdir(crsPath(), { recursive: true });
			const options = initOptions();
			let bb: Barretenberg;
			if (options.bbPath) {
				try {
					bb = await Barretenberg.initSingleton({
						...options,
						backend: BackendType.NativeUnixSocket,
					});
					bbLogger(`prove-inner backend=native bb=${options.bbPath}`);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					bbLogger(`native backend unavailable (${message}), using WASM`);
					bb = await Barretenberg.initSingleton({
						...options,
						backend: BackendType.Wasm,
					});
					bbLogger(`prove-inner backend=wasm wasm=${options.wasmPath}`);
				}
			} else {
				bb = await Barretenberg.initSingleton({
					...options,
					backend: BackendType.Wasm,
				});
				bbLogger(`prove-inner backend=wasm wasm=${options.wasmPath}`);
			}
			await bb.initSRSChonk();
			return bb;
		})();
	}
	return bbInit;
}

function fieldToHex(value: Uint8Array): string {
	return `0x${Buffer.from(value).toString("hex")}`;
}

export type ServerCircuitProveResult = {
	proof: string[];
	publicInputs: string[];
};

export async function proveCircuitOnServer(params: {
	circuitName: string;
	registryBytecodeBase64: string;
	vkeyBase64: string;
	witnessGzip: Uint8Array;
}): Promise<ServerCircuitProveResult> {
	const bytecode = registryBytecodeToProveBytes(params.registryBytecodeBase64);
	const vk = new Uint8Array(Buffer.from(params.vkeyBase64, "base64"));
	const witness = witnessBytesForProve(params.witnessGzip);

	const bb = await getBarretenberg();

	const { proof, publicInputs } = await bb.circuitProve({
		circuit: {
			name: params.circuitName,
			bytecode,
			verificationKey: vk,
		},
		witness,
		settings: { ...PROVE_SETTINGS },
	});

	return {
		proof: proof.map(fieldToHex),
		publicInputs: publicInputs.map(fieldToHex),
	};
}
