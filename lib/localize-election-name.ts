const TEST_ELECTION_RE = /^Test election (\d+)$/;

/**
 * If `name` matches "Test election N", return the locale-specific template
 * with {n} replaced by the number. Otherwise return `name` as-is.
 */
export function localizeElectionName(name: string, template: string): string {
	const match = name.match(TEST_ELECTION_RE);
	if (!match) return name;
	return template.replace("{n}", match[1]);
}
