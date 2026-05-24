import { Buffer } from "buffer";
import pako from "pako";

/**
 * Registry packaged circuits may ship `bytecode` as base64(gzip(program)) or base64(program).
 * Keep in sync with multipass/src/utils/witnessBytecode.ts
 */
export function normalizeRegistryBytecodeToAcirBase64(
	registryBase64: string,
): string {
	const buf = Buffer.from(registryBase64, "base64");
	const raw =
		buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b
			? Buffer.from(pako.ungzip(new Uint8Array(buf)))
			: buf;
	return raw.toString("base64");
}

/** Decompressed ACIR bytes for Barretenberg `circuitProve`. */
export function registryBytecodeToProveBytes(
	registryBase64: string,
): Uint8Array {
	return new Uint8Array(
		Buffer.from(
			normalizeRegistryBytecodeToAcirBase64(registryBase64),
			"base64",
		),
	);
}

export function witnessWireFormat(
	bytes: Uint8Array,
): "empty" | "gzip" | "stack" {
	if (bytes.length < 2) {
		return "empty";
	}
	if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
		return "gzip";
	}
	return "stack";
}

/**
 * ACVM may return gzip-wrapped witness bytes or a raw witness stack (JNI / Noir).
 * Barretenberg `circuitProve` expects the uncompressed stack.
 */
export function witnessBytesForProve(witnessWire: Uint8Array): Uint8Array {
	if (witnessWireFormat(witnessWire) === "gzip") {
		return pako.ungzip(witnessWire);
	}
	return witnessWire;
}
