"use client";

import {
	Button,
	Skeleton,
	Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useState } from "react";
import { PiPlus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { PartyCard } from "@/components/govern/party-card";
import { LearnMoreDialog } from "@/components/learn-more-dialog";
import type { Party } from "@/lib/types/parties";

interface MyPartySectionProps {
	userParty: Party | null;
	isLoading?: boolean;
	isUserLeader: (party: Party) => boolean;
	shortenUrl: (url: string, maxLength?: number) => string;
	dictionary: Dictionary;
	onCreateParty: () => void;
	onOpenDrawer: (party: Party) => void;
	onEditParty: (party: Party) => void;
	onDeleteParty: () => void;
}

export function MyPartySection({
	userParty,
	isLoading = false,
	isUserLeader,
	shortenUrl,
	dictionary,
	onCreateParty,
	onOpenDrawer,
	onEditParty,
	onDeleteParty,
}: MyPartySectionProps) {
	const [isLearnMoreDialogOpen, setIsLearnMoreDialogOpen] = useState(false);

	return (
		<div className="mb-6 px-6 mt-2">
			<div className="mb-3 flex items-center justify-between">
				<Typography
					variant="subtitle"
					level={1}
					className="text-[19px] font-semibold"
				>
					{dictionary.pages.govern.parties.my_party}
				</Typography>
				<button
					type="button"
					className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-900"
					onClick={onCreateParty}
					disabled={isLoading}
				>
					<PiPlus className="size-4 text-gray-900" />
				</button>
			</div>

			{isLoading ? (
				<div className="rounded-xl border border-gray-200 p-4">
					<div className="flex items-center justify-between">
						{/* Party name */}
						<div className="flex-1">
							<Skeleton height={24} width="60%" className="mb-1" />
						</div>
						<Skeleton height={32} width={32} className="rounded-full" />
					</div>
					{/* Party website */}
					<div className="flex items-center justif y-between mt-4">
						<Skeleton height={22} width={120} />
						<Skeleton height={22} width={95} />
					</div>
				</div>
			) : userParty ? (
				<PartyCard
					key={userParty.id}
					party={userParty}
					isUserLeader={isUserLeader}
					shortenUrl={shortenUrl}
					onOpenDrawer={onOpenDrawer}
					onEditParty={onEditParty}
					onDeleteParty={onDeleteParty}
					dictionary={dictionary}
					className="shadow-sm! shadow-gray-100"
				/>
			) : (
				<div className="flex flex-col items-center gap-3 p-4 text-center">
					<Typography variant="body" level={3} className="text-gray-500">
						{dictionary.pages.govern.parties.run_on_elections_and_earn}
					</Typography>
					<Button
						variant="tertiary"
						size="sm"
						onClick={() => setIsLearnMoreDialogOpen(true)}
					>
						{dictionary.pages.govern.parties.learn_more}
					</Button>

					<LearnMoreDialog
						open={isLearnMoreDialogOpen}
						onOpenChange={setIsLearnMoreDialogOpen}
						title={dictionary.pages.govern.parties.learn_more}
						externalLink={{
							url: "https://wiki.worldrepublic.org/building-blocks/party-subsidies",
							label: dictionary.pages.govern.parties.subsidies.title,
						}}
					/>
				</div>
			)}
		</div>
	);
}
