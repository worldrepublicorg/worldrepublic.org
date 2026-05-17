"use client";

import { Input, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PiUserFocus } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { VoteButton } from "@/components/vote-button";
import { getParties } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";

interface PartyVoteListProps {
	initialParties: Party[];
	electionId: string;
	lang: string;
	dictionary: Dictionary;
	/** When provided, party name/row opens the drawer instead of navigating to party page. */
	onPartyClick?: (party: Party) => void;
}

const SEARCH_DEBOUNCE_MS = 300;
const DISPLAY_INCREMENT = 20;
const FETCH_BATCH_SIZE = 100;

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function PartyVoteList({
	initialParties,
	electionId,
	lang,
	dictionary,
	onPartyClick,
}: PartyVoteListProps) {
	const [parties, setParties] = useState<Party[]>(() =>
		shuffleArray(initialParties),
	);
	const [displayCount, setDisplayCount] = useState(DISPLAY_INCREMENT);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [hasMoreParties, setHasMoreParties] = useState(
		initialParties.length >= FETCH_BATCH_SIZE,
	);
	const [partiesOffset, setPartiesOffset] = useState(0);

	const [searchTerm, setSearchTerm] = useState<string>("");
	const [searchResults, setSearchResults] = useState<Party[] | null>(null);
	const [isSearching, setIsSearching] = useState(false);
	const searchTermRef = useRef(searchTerm);
	searchTermRef.current = searchTerm;

	const observerRef = useRef<IntersectionObserver | null>(null);
	const loadMoreRef = useRef<HTMLDivElement>(null);

	const loadMoreParties = useCallback(async () => {
		if (isLoadingMore) return;
		setIsLoadingMore(true);
		try {
			const batch = await getParties({
				limit: FETCH_BATCH_SIZE,
				offset: partiesOffset,
			});
			if (batch === null || batch.length === 0) {
				setHasMoreParties(false);
				return;
			}
			const existingIds = new Set(parties.map((p) => p.id));
			const uniqueNew = batch.filter((p) => !existingIds.has(p.id));
			if (uniqueNew.length > 0) {
				setParties((prev) => [...prev, ...uniqueNew]);
			}
			setPartiesOffset((prev) => prev + batch.length);
			if (batch.length < FETCH_BATCH_SIZE) {
				setHasMoreParties(false);
			}
		} catch {
			setHasMoreParties(false);
		} finally {
			setIsLoadingMore(false);
		}
	}, [isLoadingMore, parties, partiesOffset]);

	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				const [entry] = entries;
				if (entry.isIntersecting && !isLoadingMore) {
					setDisplayCount((prevCount) => {
						const newCount = prevCount + DISPLAY_INCREMENT;
						if (newCount >= parties.length - 10 && hasMoreParties) {
							loadMoreParties();
						} else if (newCount >= parties.length && !hasMoreParties) {
							// All parties are visible
						}
						return newCount;
					});
				}
			},
			{ threshold: 0.1 },
		);

		if (loadMoreRef.current) {
			observerRef.current.observe(loadMoreRef.current);
		}

		return () => {
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
		};
	}, [isLoadingMore, parties, hasMoreParties, loadMoreParties]);

	useEffect(() => {
		const trimmed = searchTerm.trim();
		if (trimmed === "") {
			setSearchResults(null);
			setIsSearching(false);
			return;
		}
		const timeoutId = setTimeout(async () => {
			setIsSearching(true);
			try {
				const results = await getParties({
					search: trimmed,
					limit: 50,
				});
				if (searchTermRef.current.trim() === trimmed) {
					setSearchResults(results ?? []);
				}
			} catch {
				if (searchTermRef.current.trim() === trimmed) {
					setSearchResults([]);
				}
			} finally {
				if (searchTermRef.current.trim() === trimmed) {
					setIsSearching(false);
				}
			}
		}, SEARCH_DEBOUNCE_MS);
		return () => clearTimeout(timeoutId);
	}, [searchTerm]);

	useEffect(() => {
		if (searchTerm.trim() === "") {
			setDisplayCount(DISPLAY_INCREMENT);
			setSearchResults(null);
		}
	}, [searchTerm]);

	const isSearchActive = searchTerm.trim() !== "";
	const partiesToDisplay = parties.slice(0, displayCount);
	const listToShow = isSearchActive ? (searchResults ?? []) : partiesToDisplay;
	const showLoadMore =
		!isSearchActive && (parties.length > displayCount || hasMoreParties);

	if (initialParties.length === 0 && !isSearchActive) {
		return (
			<div className="rounded-xl border border-gray-200 p-6 text-center">
				<Typography variant="body" level={3} className="text-gray-500">
					{dictionary.pages.govern.elections.detail.no_parties_for_election}
				</Typography>
			</div>
		);
	}

	return (
		<div className="w-full overflow-x-hidden">
			<Typography
				variant="subtitle"
				level={1}
				className="mb-3! text-[19px] font-semibold"
			>
				{dictionary.pages.govern.elections.detail.choose_a_party}
			</Typography>

			{/* Search bar */}
			<div className="mb-5 h-12.5">
				<Input
					type="text"
					startAdornment={
						<svg
							className="h-5 w-5"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
								clipRule="evenodd"
							/>
						</svg>
					}
					label={dictionary.pages.govern.parties.search_placeholder}
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
				/>
			</div>

			{/* Parties list */}
			{isSearchActive && (isSearching || searchResults === null) ? (
				<div className="mt-12 mb-8 text-center text-sm text-gray-500">
					{dictionary.common.loading}
				</div>
			) : isSearchActive &&
				searchResults !== null &&
				searchResults.length === 0 ? (
				<div className="mt-12 mb-8 text-center text-sm text-gray-500">
					{dictionary.pages.govern.parties.no_parties_found}
				</div>
			) : (
				<>
					<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
						<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
							{listToShow.map((party) => (
								<div
									key={party.id}
									className="flex items-center justify-between gap-4"
								>
									{onPartyClick ? (
										<button
											type="button"
											onClick={() => onPartyClick(party)}
											className="flex-1 min-w-0 text-left cursor-pointer rounded-md -m-1 p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-inset"
										>
											<Typography
												variant="subtitle"
												level={3}
												className="text-gray-900 truncate"
											>
												{party.name}
											</Typography>
											<div className="flex items-center gap-1 mt-1">
												<PiUserFocus className="size-3.5 text-gray-400 shrink-0" />
												<Typography
													variant="body"
													level={4}
													className="text-gray-500 truncate"
												>
													{party.leaderUsername}
												</Typography>
											</div>
										</button>
									) : (
										<Link
											href={`/${lang}/govern/parties/${party.id}`}
											className="flex-1 min-w-0"
										>
											<Typography
												variant="subtitle"
												level={3}
												className="text-gray-900 truncate"
											>
												{party.name}
											</Typography>
											<div className="flex items-center gap-1 mt-1">
												<PiUserFocus className="size-3.5 text-gray-400 shrink-0" />
												<Typography
													variant="body"
													level={4}
													className="text-gray-500 truncate"
												>
													{party.leaderUsername}
												</Typography>
											</div>
										</Link>
									)}
									<VoteButton
										electionId={electionId}
										partyId={party.id}
										size="sm"
										dictionary={dictionary}
									/>
								</div>
							))}
						</div>
					</div>
					{showLoadMore && <div ref={loadMoreRef} className="h-14 py-4" />}
				</>
			)}
		</div>
	);
}
