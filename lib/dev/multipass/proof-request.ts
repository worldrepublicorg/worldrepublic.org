import "server-only";

import type { MultipassDevSession } from "@/lib/dev/multipass/sessions";

/** Vocdoni-shaped payload for multipass `ProofRequestPayload` (see multipass `ServerClient.ts`). */
export type MultipassProofRequestPayload = {
	kind: string;
	version: number;
	aggregateUrl: string;
	petitionId?: string;
	service?: {
		name?: string;
		logo?: string;
		purpose?: string;
		scope?: string;
		mode?: string;
		devMode?: boolean;
		domain?: string;
	};
	query?: Record<string, unknown>;
};

export function buildDevProofRequestPayload(
	origin: string,
	session: MultipassDevSession,
): MultipassProofRequestPayload {
	return {
		kind: "vocdoni-passport-request",
		version: 1,
		petitionId: session.id,
		aggregateUrl: `${origin}/api/dev/multipass/proofs/aggregate`,
		service: {
			name: "World Republic (dev)",
			purpose: "Dev verification session",
			devMode: true,
			domain: new URL(origin).host,
		},
		query: {
			nationality: { disclose: true },
		},
	};
}
