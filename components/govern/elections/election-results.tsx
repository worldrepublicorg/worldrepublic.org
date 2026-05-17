"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { ElectionResult } from "@/lib/types/elections";

interface ElectionResultsProps {
	results: ElectionResult[];
	dictionary: Dictionary;
	/** Called when a result row is activated; use to open party detail, etc. */
	onResultClick: (result: ElectionResult) => void;
}

export function ElectionResults({
	results,
	dictionary,
	onResultClick,
}: ElectionResultsProps) {
	const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);
	const t = dictionary.pages.govern.elections.detail;

	// Sort by vote count descending, then by party name ascending for ties
	const sorted = [...results].sort((a, b) => {
		if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
		return a.partyName.localeCompare(b.partyName, undefined, {
			sensitivity: "base",
		});
	});

	// Competition ranking: same rank for same vote count
	const withRank: { result: ElectionResult; rank: number }[] = [];
	for (let i = 0; i < sorted.length; i++) {
		const result = sorted[i];
		const rank =
			i > 0 && result.voteCount === sorted[i - 1].voteCount
				? withRank[i - 1].rank
				: i + 1;
		withRank.push({ result, rank });
	}

	return (
		<div className="overflow-hidden rounded-xl border border-gray-200">
			<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
				<div className="flex items-center justify-between">
					<Typography variant="subtitle" level={3} className="text-gray-900">
						{t.results_title}
					</Typography>
					<Typography variant="body" level={3} className="text-gray-500">
						{totalVotes} {totalVotes === 1 ? t.vote_singular : t.vote_plural}
					</Typography>
				</div>
			</div>

			{results.length === 0 ? (
				<div className="p-6 text-center">
					<Typography variant="body" level={3} className="text-gray-500">
						{t.no_votes}
					</Typography>
				</div>
			) : (
				<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
					{withRank.map(({ result, rank }) => {
						const percentage =
							totalVotes > 0
								? Math.round((result.voteCount / totalVotes) * 100)
								: 0;

						return (
							<button
								key={result.partyId}
								type="button"
								onClick={() => onResultClick(result)}
								className="w-full cursor-pointer border-0 bg-transparent p-0 text-left font-inherit"
							>
								<div className="flex items-center justify-between gap-2 mb-2">
									<div className="flex min-w-0 flex-1 items-center gap-2">
										<span className="shrink-0 text-sm font-medium text-gray-400">
											#{rank}
										</span>
										<Typography
											variant="subtitle"
											level={3}
											className="min-w-0 text-gray-900"
										>
											{result.partyName}
										</Typography>
									</div>
									<Typography
										variant="body"
										level={3}
										className="shrink-0 whitespace-nowrap text-gray-600"
									>
										{result.voteCount}{" "}
										{result.voteCount === 1 ? t.vote_singular : t.vote_plural} (
										{percentage}%)
									</Typography>
								</div>
								{/* Bar visualization */}
								<div className="h-2 w-full rounded-full bg-gray-100">
									<div
										className="h-2 rounded-full bg-gray-900 transition-all duration-500"
										style={{ width: `${percentage}%` }}
									/>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
