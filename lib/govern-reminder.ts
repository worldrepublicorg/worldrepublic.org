const GOVERN_LAST_SEEN_ACTIVE_ELECTION_KEY =
	"world_republic_govern_last_seen_active_election_id";

function readLastSeenActiveElectionId(): string | null {
	if (typeof window === "undefined") return null;
	try {
		const stored = localStorage.getItem(GOVERN_LAST_SEEN_ACTIVE_ELECTION_KEY);
		return typeof stored === "string" && stored.length > 0 ? stored : null;
	} catch {
		return null;
	}
}

export function hasUnseenActiveElection(
	activeElectionId: string | null,
): boolean {
	if (!activeElectionId) return false;
	return readLastSeenActiveElectionId() !== activeElectionId;
}

export function markActiveElectionSeen(activeElectionId: string | null) {
	if (!activeElectionId || typeof window === "undefined") return;
	const alreadySeenId = readLastSeenActiveElectionId();
	if (alreadySeenId === activeElectionId) return;

	try {
		localStorage.setItem(
			GOVERN_LAST_SEEN_ACTIVE_ELECTION_KEY,
			activeElectionId,
		);
	} catch {
		// ignore localStorage write failures
	}
}

export function getGovernReminderStorageKey(): string {
	return GOVERN_LAST_SEEN_ACTIVE_ELECTION_KEY;
}
