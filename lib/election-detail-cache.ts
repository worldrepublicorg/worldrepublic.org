import type { GetElectionDetailResult } from "@/lib/actions/elections";

const CACHE_KEY_PREFIX = "electionDetail-";

function cacheKey(id: string): string {
	return `${CACHE_KEY_PREFIX}${id}`;
}

function isElectionDetailShape(
	value: unknown,
): value is GetElectionDetailResult {
	if (!value || typeof value !== "object") return false;
	const obj = value as Record<string, unknown>;
	if (!("election" in obj) || !("parties" in obj) || !("results" in obj))
		return false;
	if (obj.election !== null && typeof obj.election !== "object") return false;
	if (obj.parties !== null && !Array.isArray(obj.parties)) return false;
	if (!Array.isArray(obj.results)) return false;
	return true;
}

export function getCachedElectionDetail(
	id: string,
): GetElectionDetailResult | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(cacheKey(id));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as unknown;
		if (!isElectionDetailShape(parsed)) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function setCachedElectionDetail(
	id: string,
	data: GetElectionDetailResult,
) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(cacheKey(id), JSON.stringify(data));
	} catch {
		// ignore
	}
}
