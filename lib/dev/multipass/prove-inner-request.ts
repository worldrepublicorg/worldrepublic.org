import { Buffer } from "buffer";
import { MULTIPASS_CIRCUIT_VERSION } from "@/lib/dev/multipass/registry-constants";

const MAX_WITNESS_B64_LEN = 12 * 1024 * 1024;

export type ProveInnerRequestBody = {
	circuitName?: string;
	circuitVersion?: string;
	witness?: string;
};

export type ProveInnerValidatedRequest = {
	circuitName: string;
	circuitVersion: string;
	witnessGzip: Uint8Array;
};

export function parseProveInnerBody(
	raw: string,
): ProveInnerRequestBody | { error: string } {
	if (!raw.trim()) {
		return { error: "Empty body" };
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== "object") {
			return { error: "Body must be a JSON object" };
		}
		return parsed as ProveInnerRequestBody;
	} catch {
		return { error: "Invalid JSON" };
	}
}

export function validateProveInnerBody(
	body: ProveInnerRequestBody,
): ProveInnerValidatedRequest | { error: string } {
	const circuitName =
		typeof body.circuitName === "string" ? body.circuitName.trim() : "";
	const circuitVersion =
		typeof body.circuitVersion === "string" && body.circuitVersion.trim()
			? body.circuitVersion.trim()
			: MULTIPASS_CIRCUIT_VERSION;
	const witnessB64 =
		typeof body.witness === "string" ? body.witness.trim() : "";

	if (!circuitName) {
		return { error: "circuitName is required" };
	}
	if (!witnessB64) {
		return { error: "witness is required" };
	}
	if (witnessB64.length > MAX_WITNESS_B64_LEN) {
		return { error: "Witness too large" };
	}

	let witnessGzip: Uint8Array;
	try {
		const buf = Buffer.from(witnessB64, "base64");
		if (buf.length === 0) {
			return { error: "Witness decodes to empty buffer" };
		}
		witnessGzip = new Uint8Array(buf);
	} catch {
		return { error: "Invalid witness base64" };
	}

	return { circuitName, circuitVersion, witnessGzip };
}
