"use client";

import {
	Button,
	Skeleton,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PiCopy, PiInfoFill, PiLinkSimple, PiUserFocus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { VoteButton } from "@/components/vote-button";
import { getParty } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";
import { copyToClipboard } from "@/lib/utils";

interface PartyDetailContentProps {
	partyId: string;
	dictionary: Dictionary;
}

export function PartyDetailContent({
	partyId,
	dictionary,
}: PartyDetailContentProps) {
	const { lang } = useParams<{ lang: string }>();
	const { toast } = useToast();
	const toastRef = useRef(toast);
	toastRef.current = toast;

	const [party, setParty] = useState<Party | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

	// Fetch party data
	useEffect(() => {
		let cancelled = false;

		const fetchData = async () => {
			if (!partyId || typeof partyId !== "string") {
				return;
			}

			try {
				setIsLoading(true);
				setError("");

				// Fetch party details
				const partyData = await getParty(partyId);
				if (cancelled) return;
				if (!partyData) {
					throw new Error("Party not found");
				}
				setParty(partyData);
			} catch (error) {
				if (cancelled) return;
				console.error("[PartyDetailContent] Error fetching data:", error);
				setError(
					error instanceof Error ? error.message : "Failed to load party data",
				);
				toastRef.current.error({
					title: dictionary.pages.govern.parties.detail.failed_to_load,
				});
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void fetchData();
		return () => {
			cancelled = true;
		};
	}, [partyId, dictionary.pages.govern.parties.detail.failed_to_load]);

	// Copy leader address to clipboard
	const handleCopyLeaderAddress = async () => {
		if (!party?.leaderUsername) return;
		await copyToClipboard(party.leaderUsername, toast, {
			success: dictionary.toasts.copied,
			error: dictionary.toasts.generic_error,
		});
	};

	// Note: Leader check is not needed on detail page since management is on the card

	return (
		<div className="flex flex-1 min-h-full flex-col">
			{isLoading ? (
				// Loading state
				<div className="flex flex-1 min-h-full flex-col">
					{/* Hero section */}
					<div className="mt-6 mb-10 flex flex-col items-center">
						<Skeleton height={36} width="75%" className="rounded-lg" />
					</div>

					{/* Description card */}
					<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
						<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
							<Skeleton height={24} width={120} className="rounded-lg" />
						</div>
						<div className="p-4">
							<Skeleton height={80} width="100%" className="rounded" />
						</div>
					</div>

					{/* Party Info card */}
					<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
						<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
							<Skeleton height={24} width={80} className="rounded-lg" />
						</div>
						<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
							<div className="flex items-center justify-between gap-6">
								<Skeleton height={17} width="33%" className="rounded" />
								<Skeleton height={17} width="33%" className="rounded" />
							</div>
							<div className="flex items-center justify-between gap-6">
								<Skeleton height={17} width="25%" className="rounded" />
								<Skeleton height={17} width="50%" className="rounded" />
							</div>
						</div>
					</div>

					{/* Vote button skeleton */}
					<div className="mt-auto">
						<Skeleton height={56} width="100%" className="mt-6! rounded-full" />
					</div>
				</div>
			) : error ? (
				// Error state
				<div className="flex flex-1 flex-col items-center justify-center">
					<PiInfoFill className="h-16 w-16 text-gray-300" />
					<Typography
						variant="heading"
						level={3}
						className="mt-4 text-center text-gray-900"
					>
						{dictionary.pages.govern.parties.detail.error_loading}
					</Typography>
					<Typography
						variant="body"
						level={2}
						className="mt-2 text-center text-gray-500"
					>
						{error}
					</Typography>
					<Link href={`/${lang}/govern?tab=parties`}>
						<Button variant="secondary" className="mt-8">
							{dictionary.pages.govern.parties.detail.back_to_parties}
						</Button>
					</Link>
				</div>
			) : party ? (
				// Party details
				<div className="flex flex-1 min-h-full flex-col">
					{/* Hero section */}
					<div className="mt-6 mb-10 w-full min-w-0 flex flex-col items-center">
						<Typography
							variant="heading"
							level={2}
							className="w-full min-w-0 wrap-break-word text-center text-gray-900"
							title={party.name}
						>
							{party.name}
						</Typography>
					</div>

					{/* Description */}
					{party.description && (
						<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
							<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
								<Typography
									variant="subtitle"
									level={3}
									className="text-gray-900"
								>
									{dictionary.pages.govern.parties.detail.description}
								</Typography>
							</div>
							<Typography
								variant="body"
								level={3}
								className="wrap-break-word p-4 text-gray-700 text-[14px]"
							>
								{party.description}
							</Typography>
						</div>
					)}

					{/* Party Info */}
					<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
						<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
							<Typography variant="subtitle" level={3}>
								{dictionary.pages.govern.parties.detail.party_info}
							</Typography>
						</div>

						<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
							{/* Leader */}
							{party.leaderUsername && (
								<div className="flex items-center justify-between gap-6">
									<div className="flex items-center">
										<PiUserFocus
											className="mr-2 text-gray-400 shrink-0"
											size={14}
										/>
										<Typography
											variant="body"
											level={3}
											className="text-gray-700 text-[14px]"
										>
											{dictionary.pages.govern.parties.detail.leader}
										</Typography>
									</div>
									<button
										type="button"
										onClick={handleCopyLeaderAddress}
										className="min-w-0 flex-1 flex items-center justify-end gap-1 cursor-pointer text-right overflow-hidden"
									>
										<Typography
											variant="body"
											level={3}
											className="font-medium text-gray-900 truncate text-[14px]"
											title={party.leaderUsername}
										>
											{party.leaderUsername}
										</Typography>
										<PiCopy className="text-gray-400 shrink-0" size={14} />
									</button>
								</div>
							)}

							{/* Website */}
							{party.websiteUrl && (
								<div className="flex items-center justify-between gap-6">
									<div className="flex items-center shrink-0">
										<PiLinkSimple
											className="mr-2 text-gray-400 shrink-0"
											size={14}
										/>
										<Typography
											variant="body"
											level={3}
											className="whitespace-nowrap text-gray-700 text-[14px]"
										>
											{dictionary.pages.govern.parties.detail.website}
										</Typography>
									</div>
									<a
										href={
											party.websiteUrl.startsWith("http")
												? party.websiteUrl
												: `https://${party.websiteUrl}`
										}
										target="_blank"
										rel="noopener noreferrer"
										className="min-w-0 flex-1 flex justify-end overflow-hidden text-right"
									>
										<Typography
											variant="body"
											level={3}
											className="font-medium truncate text-[14px]"
											title={party.websiteUrl}
										>
											{party.websiteUrl}
										</Typography>
									</a>
								</div>
							)}
						</div>
					</div>

					{/* Vote button */}
					<div className="mt-auto">
						<VoteButton
							fullWidth
							className="mt-6!"
							label={dictionary.common.vote}
							dictionary={dictionary}
							partyId={party.id}
							electionId="9341dcef-7c00-4f5b-9c4b-6e4b481fc607"
						/>
					</div>
				</div>
			) : (
				// Not found state
				<div className="flex flex-1 flex-col items-center justify-center">
					<PiInfoFill className="h-16 w-16 text-gray-300" />
					<Typography
						variant="heading"
						level={3}
						className="mt-4 text-center text-gray-900"
					>
						{dictionary.pages.govern.parties.detail.party_not_found}
					</Typography>
					<Typography
						variant="body"
						level={2}
						className="mt-2 text-center text-gray-500"
					>
						{dictionary.pages.govern.parties.detail.not_found_description}
					</Typography>
					<Link href={`/${lang}/govern?tab=parties`}>
						<Button variant="secondary" className="mt-8">
							{dictionary.pages.govern.parties.detail.back_to_parties}
						</Button>
					</Link>
				</div>
			)}
		</div>
	);
}
