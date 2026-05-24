import "server-only";

import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Barretenberg } from "@aztec/bb.js";
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

async function getBarretenberg(): Promise<Barretenberg> {
	if (!bbInit) {
		bbInit = (async () => {
			await mkdir(crsPath(), { recursive: true });
			const bb = await Barretenberg.initSingleton({
				crsPath: crsPath(),
				logger: (msg) => {
					if (process.env.BB_DEBUG === "1") {
						console.info(`[bb] ${msg}`);
					}
				},
			});
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
