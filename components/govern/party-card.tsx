"use client";

import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTrigger,
	Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useRef, useState } from "react";
import {
	PiGear,
	PiGearFill,
	PiLinkSimple,
	PiPencilSimple,
	PiTrash,
	PiUserFocus,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import type { Party } from "@/lib/types/parties";
import { cn } from "@/lib/utils";

interface PartyCardProps {
	party: Party;
	isUserLeader: (party: Party) => boolean;
	shortenUrl: (url: string, maxLength?: number) => string;
	onOpenDrawer: (party: Party) => void;
	onEditParty: (party: Party) => void;
	onDeleteParty: () => void;
	isLastItem?: boolean;
	dictionary: Dictionary;
	className?: string;
}

export function PartyCard({
	party,
	isUserLeader,
	shortenUrl,
	onOpenDrawer,
	onEditParty,
	onDeleteParty,
	isLastItem = false,
	dictionary,
	className,
}: PartyCardProps) {
	const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
	const justClosedDialogRef = useRef(false);
	const partyManagementTitle = dictionary.pages.govern.parties.party_management;

	const handleDialogOpenChange = (open: boolean) => {
		setIsManagementDialogOpen(open);
		if (!open) {
			// Mark that we just closed the dialog to prevent drawer from opening
			justClosedDialogRef.current = true;
			// Reset the flag after a short delay to allow normal clicks to work
			setTimeout(() => {
				justClosedDialogRef.current = false;
			}, 100);
		}
	};

	const handleCardClick = () => {
		// Don't open drawer if the dialog is open or we just closed it
		if (isManagementDialogOpen || justClosedDialogRef.current) {
			return;
		}
		onOpenDrawer(party);
	};

	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-xl border border-gray-200",
				!isLastItem && "mb-4",
				className,
			)}
		>
			<button
				type="button"
				className="absolute inset-0 z-0 rounded-xl"
				aria-label={party.name}
				onClick={handleCardClick}
			/>
			<div className="pointer-events-none relative z-10 p-4">
				<div className="flex items-center justify-between gap-2">
					<div className="min-w-0 flex-1">
						<Typography
							variant="subtitle"
							level={1}
							className="wrap-break-word text-[19px] font-semibold"
							title={party.name}
						>
							{party.name}
						</Typography>
					</div>
					<div className="relative flex items-center gap-2">
						{isUserLeader(party) && (
							<AlertDialog
								open={isManagementDialogOpen}
								onOpenChange={handleDialogOpenChange}
							>
								<AlertDialogTrigger asChild>
									<button
										type="button"
										className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
										title={partyManagementTitle}
										onClick={(e) => e.stopPropagation()}
									>
										<PiGear size={16} />
									</button>
								</AlertDialogTrigger>

								<AlertDialogContent>
									<AlertDialogHeader
										icon={
											<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
												<PiGearFill className="h-[30px] w-[30px] text-gray-400" />
											</div>
										}
									>
										<Typography variant="heading" level={3}>
											{partyManagementTitle}
										</Typography>
									</AlertDialogHeader>

									<div className="flex flex-col gap-2">
										<CustomListItem
											label={dictionary.pages.govern.parties.edit_party_info}
											startAdornment={
												<PiPencilSimple className="size-5 text-gray-400" />
											}
											onClick={(e) => {
												e.stopPropagation();
												setIsManagementDialogOpen(false);
												onEditParty(party);
											}}
										/>

										<CustomListItem
											label={dictionary.pages.govern.parties.delete_party}
											startAdornment={
												<PiTrash className="size-5 text-gray-400" />
											}
											onClick={(e) => {
												e.stopPropagation();
												setIsManagementDialogOpen(false);
												onDeleteParty();
											}}
										/>
									</div>
								</AlertDialogContent>
							</AlertDialog>
						)}
					</div>
				</div>

				{party.description && (
					<div className="mt-3">
						<Typography
							as="p"
							variant="body"
							level={2}
							title={party.description}
							className="line-clamp-3 wrap-break-word text-[14px] text-gray-600 leading-snug!"
						>
							{party.description}
						</Typography>
					</div>
				)}

				<div className="mt-3 flex justify-between gap-3">
					<div className="flex items-center gap-1">
						{party.websiteUrl ? (
							<>
								<PiLinkSimple className="text-gray-500 shrink-0" size={14} />
								<a
									href={
										party.websiteUrl.startsWith("http")
											? party.websiteUrl
											: `https://${party.websiteUrl}`
									}
									target="_blank"
									rel="noopener noreferrer"
									className="-m-1 pointer-events-auto flex rounded-md px-1 py-1 transition-colors"
									title={party.websiteUrl}
									onClick={(e) => e.stopPropagation()}
								>
									<Typography
										variant="label"
										level={1}
										className="line-clamp-1 break-all text-[14px] text-[#0A66C2] font-normal"
									>
										{shortenUrl(party.websiteUrl)}
									</Typography>
								</a>
							</>
						) : (
							<PiLinkSimple className="text-gray-300 shrink-0" size={14} />
						)}
					</div>
					<div className="flex items-center gap-1">
						<PiUserFocus className="text-gray-500" size={14} />
						<Typography
							as="span"
							variant="label"
							level={1}
							className="text-[14px] font-semibold"
						>
							{party.leaderUsername}
						</Typography>
					</div>
				</div>
			</div>
		</div>
	);
}
