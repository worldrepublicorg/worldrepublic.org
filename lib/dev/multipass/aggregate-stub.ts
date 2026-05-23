import "server-only";

import { createHash, randomUUID } from "node:crypto";

type AggregateRequestBody = {
	request?: { petitionId?: string };
};

export function parseAggregateRequestBody(
	raw: string,
): AggregateRequestBody | { error: string } {
	if (!raw.trim()) {
		return {};
	}
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!parsed || typeof parsed !== "object") {
			return { error: "Body must be a JSON object" };
		}
		return parsed as AggregateRequestBody;
	} catch {
		return { error: "Invalid JSON" };
	}
}

/** Phase 1.4 stub — no crypto; real verify in 1.11+. */
export function buildStubAggregateResponse(body: AggregateRequestBody) {
	const sessionId =
		typeof body.request?.petitionId === "string"
			? body.request.petitionId
			: undefined;

	const nullifierSeed = sessionId ?? randomUUID();
	const nullifier = `dev-stub:${createHash("sha256").update(nullifierSeed).digest("hex").slice(0, 32)}`;

	return {
		nullifier,
		name: "world-republic-dev-stub",
		proof: "",
		publicInputs: [] as string[],
		vkeyHash: "",
		version: "stub",
	};
}
