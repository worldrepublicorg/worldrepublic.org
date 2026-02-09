export const FEATURED_ELECTION_CACHE_KEY = "featuredElectionCache";

export function getCachedFeaturedElectionId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FEATURED_ELECTION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "string") {
      return parsed;
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      "electionId" in parsed &&
      typeof (parsed as { electionId: unknown }).electionId === "string"
    ) {
      return (parsed as { electionId: string }).electionId;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedFeaturedElectionId(electionId: string | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      FEATURED_ELECTION_CACHE_KEY,
      JSON.stringify(electionId),
    );
  } catch {
    // ignore
  }
}
