import "server-only";

import type { ProveInnerValidatedRequest } from "@/lib/dev/multipass/prove-inner-request";
import {
	registryBytecodeToProveBytes,
	witnessWireFormat,
} from "@/lib/dev/multipass/witness-bytecode";

export type ProveInnerSuccess = {
	proof: string[];
	publicInputs: string[];
	circuitName: string;
};

export async function runProveInner(
	validated: ProveInnerValidatedRequest,
): Promise<ProveInnerSuccess | { error: string; status: number }> {
	const { circuitName, circuitVersion, witnessGzip } = validated;
	const startedAt = Date.now();

	try {
		const { fetchPackagedCircuitForProve } = await import(
			"@/lib/dev/multipass/registry"
		);
		const { proveCircuitOnServer } = await import(
			"@/lib/dev/multipass/barretenberg-prove"
		);

		const { art } = await fetchPackagedCircuitForProve(
			circuitName,
			circuitVersion,
		);
		const acir = registryBytecodeToProveBytes(art.bytecode);
		const result = await proveCircuitOnServer({
			circuitName,
			registryBytecodeBase64: art.bytecode,
			vkeyBase64: art.vkey,
			witnessGzip,
		});

		console.info(
			"[multipass dev prove-inner]",
			JSON.stringify({
				circuitName,
				circuitVersion,
				witnessWire: witnessWireFormat(witnessGzip),
				witnessBytes: witnessGzip.length,
				acirBytes: acir.length,
				proofFields: result.proof.length,
				publicInputs: result.publicInputs.length,
				durationMs: Date.now() - startedAt,
			}),
		);

		return {
			...result,
			circuitName,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error("[multipass dev prove-inner] failed", message);
		return { error: message || "Prove failed", status: 500 };
	}
}
