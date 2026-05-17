"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { PiCalendarBlank, PiCoins } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { formatElectionDateTime } from "@/lib/format-date";
import { getSafeLocale } from "@/lib/locale";
import { localizeElectionName } from "@/lib/localize-election-name";
import type { Election } from "@/lib/types/elections";

interface ElectionHeroCardProps {
	election: Election;
	lang: string;
	dictionary: Dictionary;
}

export function ElectionHeroCard({
	election,
	lang,
	dictionary,
}: ElectionHeroCardProps) {
	const locale = getSafeLocale(lang);
	const t = dictionary.pages.govern.elections.detail;
	const now = Date.now();
	const isActive = now >= election.startsAt && now <= election.endsAt;
	const isUpcoming = now < election.startsAt;

	return (
		<Link
			href={`/${lang}/govern/elections?id=${election.id}`}
			className="block mb-6"
		>
			<div className="rounded-2xl border border-gray-200 p-6 shadow-sm! shadow-gray-100">
				<div className="flex items-center justify-between mb-3">
					<div className="flex-1">
						<Typography
							variant="subtitle"
							level={1}
							className="text-[22px] font-semibold"
						>
							{localizeElectionName(election.name, t.test_election_name)}
						</Typography>
					</div>
					<div className="flex items-center">
						{isActive && (
							<span className="inline-flex items-center rounded-full bg-green-100 px-3 py-[3px] text-xs! font-medium text-green-800">
								{t.status_active}
							</span>
						)}
						{isUpcoming && (
							<span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-[3px] text-xs! font-medium text-blue-800">
								{t.status_upcoming}
							</span>
						)}
					</div>
				</div>

				<div className="flex flex-col gap-1.5 mt-4">
					<div className="flex items-center gap-2 text-gray-600">
						<PiCalendarBlank className="text-gray-500 shrink-0" size={13} />
						<Typography variant="body" level={3} className="text-[13px]">
							{formatElectionDateTime(election.startsAt, lang)} -{" "}
							{formatElectionDateTime(election.endsAt, lang)}
						</Typography>
					</div>

					<div className="flex items-center gap-2 text-gray-600">
						<PiCoins className="text-gray-500 shrink-0" size={13} />
						<Typography variant="body" level={3} className="text-[13px]">
							{t.reward_pool.replace(
								"{amount}",
								Number.parseInt(election.rewardPool, 10).toLocaleString(locale),
							)}
						</Typography>
					</div>
				</div>

				<Button size="sm" fullWidth className="mt-5!">
					{dictionary.common.vote}
				</Button>
			</div>
		</Link>
	);
}
