import type { Election } from "@/lib/types/elections";

/**
 * Election is active in the half-open interval [startsAt, endsAt).
 */
export function isElectionActive(
	election: Election,
	now = Date.now(),
): boolean {
	return now >= election.startsAt && now < election.endsAt;
}

/**
 * Pick the most important election for hero/featured display.
 * Priority: active > soonest upcoming > most recently ended.
 */
export function pickFeaturedElection(elections: Election[]): Election | null {
	if (elections.length === 0) return null;

	const now = Date.now();

	const active = elections.filter((election) =>
		isElectionActive(election, now),
	);
	if (active.length > 0) {
		return active.sort((a, b) => a.endsAt - b.endsAt)[0];
	}

	const upcoming = elections.filter((election) => now < election.startsAt);
	if (upcoming.length > 0) {
		return upcoming.sort((a, b) => a.startsAt - b.startsAt)[0];
	}

	return elections.sort((a, b) => b.endsAt - a.endsAt)[0];
}
