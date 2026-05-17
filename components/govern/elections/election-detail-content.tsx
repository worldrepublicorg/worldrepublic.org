"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PiCalendarBlank, PiCoins, PiInfoFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ElectionResults } from "@/components/govern/elections/election-results";
import { PartyVoteList } from "@/components/govern/elections/party-vote-list";
import { PartyDetailDrawer } from "@/components/party-detail-drawer";
import { VoteButton } from "@/components/vote-button";
import { formatElectionDateTime } from "@/lib/format-date";
import { getSafeLocale } from "@/lib/locale";
import { localizeElectionName } from "@/lib/localize-election-name";
import type { Election, ElectionResult } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";

interface ElectionDetailContentProps {
	election: Election | null;
	parties: Party[] | null;
	results: ElectionResult[];
	lang: string;
	dictionary: Dictionary;
}

export function ElectionDetailContent({
	election,
	parties,
	results,
	lang,
	dictionary,
}: ElectionDetailContentProps) {
	const locale = getSafeLocale(lang);
	const router = useRouter();
	const t = dictionary.pages.govern.elections.detail;
	const [selectedPartyForDrawer, setSelectedPartyForDrawer] =
		useState<Party | null>(null);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	if (!election) {
		return (
			<div className="flex flex-1 flex-col items-center justify-center">
				<PiInfoFill className="h-16 w-16 text-gray-300" />
				<Typography
					variant="heading"
					level={3}
					className="mt-4! text-center text-gray-900"
				>
					{t.not_found}
				</Typography>
				<Typography
					variant="body"
					level={2}
					className="mt-2! text-center text-gray-500"
				>
					{t.not_found_description}
				</Typography>
				<Link href={`/${lang}/vote`}>
					<Button variant="secondary" className="mt-8!">
						{t.back_to_elections}
					</Button>
				</Link>
			</div>
		);
	}

	const now = Date.now();
	const isActive = now >= election.startsAt && now <= election.endsAt;
	const isUpcoming = now < election.startsAt;
	const isEnded = now > election.endsAt;

	return (
		<div className="flex flex-1 min-h-full flex-col">
			{/* Hero section */}
			<div className="mb-8 flex flex-wrap items-center justify-center gap-3">
				<Typography
					variant="heading"
					level={2}
					className="text-center text-gray-900"
				>
					{localizeElectionName(election.name, t.test_election_name)}
				</Typography>
				{isActive && (
					<span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-3 py-1 text-[13px]! font-medium text-green-800">
						{t.status_active}
					</span>
				)}
				{isUpcoming && (
					<span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-3 py-1 text-[13px]! font-medium text-blue-800">
						{t.status_upcoming}
					</span>
				)}
				{isEnded && (
					<span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-3 py-1 text-[13px]! font-medium text-gray-800">
						{t.status_ended}
					</span>
				)}
			</div>

			{/* Election info card */}
			<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
				<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
					<Typography variant="subtitle" level={3} className="text-gray-900">
						{t.election_info}
					</Typography>
				</div>
				<div className="flex flex-col gap-5.5 p-4 divide-y divide-gray-100">
					<div className="flex items-center gap-2">
						<PiCalendarBlank className="text-gray-400 shrink-0" size={14} />
						<Typography
							variant="body"
							level={3}
							className="text-[14px] text-gray-700"
						>
							{formatElectionDateTime(election.startsAt, lang)} –{" "}
							{formatElectionDateTime(election.endsAt, lang)}
						</Typography>
					</div>
					<div className="flex items-center gap-2">
						<PiCoins className="text-gray-400 shrink-0" size={14} />
						<Typography
							variant="body"
							level={3}
							className="text-[14px] text-gray-700"
						>
							{t.reward_pool.replace(
								"{amount}",
								Number.parseInt(election.rewardPool, 10).toLocaleString(locale),
							)}
						</Typography>
					</div>
				</div>
			</div>

			{/* Conditional content based on election status */}
			{isActive &&
				(parties === null ? (
					<div className="mt-12 mb-8 flex flex-col items-center gap-3 p-4 text-center">
						<Typography variant="body" level={3} className="text-gray-500">
							{dictionary.pages.govern.parties.error_loading}
						</Typography>
						<Button
							variant="tertiary"
							size="sm"
							onClick={() => router.refresh()}
						>
							{dictionary.pages.govern.parties.refresh}
						</Button>
					</div>
				) : (
					<PartyVoteList
						initialParties={parties}
						electionId={election.id}
						lang={lang}
						dictionary={dictionary}
						onPartyClick={(party) => {
							setSelectedPartyForDrawer(party);
							setIsDrawerOpen(true);
						}}
					/>
				))}

			{isUpcoming && (
				<div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
					<Typography variant="body" level={3} className="text-gray-500">
						{dictionary.pages.govern.vote.test_verification.description}
					</Typography>
					<VoteButton
						size="sm"
						fullWidth
						label={dictionary.pages.govern.vote.test_verification.button}
						dictionary={dictionary}
						electionId="b488f0f7-3e50-4f2d-bc29-ee6ab35a90a1"
						partyId="72fd551e-19fe-4274-a9e6-14e69654d224"
					/>
				</div>
			)}

			{isEnded && (
				<ElectionResults
					results={results}
					dictionary={dictionary}
					onResultClick={(result) => {
						setSelectedPartyForDrawer({
							id: result.partyId,
							name: result.partyName,
						} as Party);
						setIsDrawerOpen(true);
					}}
				/>
			)}

			<PartyDetailDrawer
				open={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
				party={selectedPartyForDrawer}
				dictionary={dictionary}
			/>
		</div>
	);
}
