import "server-only";

import { RegistryClient } from "@zkpassport/registry";
import {
	MULTIPASS_CHAIN_ID,
	MULTIPASS_CIRCUIT_VERSION,
} from "@/lib/dev/multipass/registry-constants";

export { MULTIPASS_CHAIN_ID, MULTIPASS_CIRCUIT_VERSION };

let registryClient: RegistryClient | null = null;

export function getRegistryClient(): RegistryClient {
	if (!registryClient) {
		registryClient = new RegistryClient({ chainId: MULTIPASS_CHAIN_ID });
	}
	return registryClient;
}

export async function fetchPackagedCircuitForProve(
	circuitName: string,
	circuitVersion: string = MULTIPASS_CIRCUIT_VERSION,
) {
	const registry = getRegistryClient();
	const manifest = await registry.getCircuitManifest(undefined, {
		version: circuitVersion,
		validate: false,
	});
	if (!manifest?.circuits?.[circuitName]) {
		throw new Error(`Circuit not found in manifest: ${circuitName}`);
	}
	const art = await registry.getPackagedCircuit(circuitName, manifest, {
		validate: false,
	});
	if (!art?.bytecode || !art?.vkey) {
		throw new Error(`Packaged circuit missing bytecode/vkey: ${circuitName}`);
	}
	return { manifest, art };
}
