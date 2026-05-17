"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";
import { PiCaretLeft } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { ElectionDetailContent } from "@/components/govern/elections/election-detail-content";
import { ElectionDetailPageSkeleton } from "@/components/govern/elections/election-detail-page-skeleton";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { TopBar } from "@/components/topbar";
import { getElectionDetail } from "@/lib/actions/elections";
import {
	getCachedElectionDetail,
	setCachedElectionDetail,
} from "@/lib/election-detail-cache";

interface ElectionDetailPageClientProps {
	lang: string;
	dictionary: Dictionary;
}

export default function ElectionDetailPageClient({
	lang,
	dictionary,
}: ElectionDetailPageClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const id = searchParams.get("id");

	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [cachedData] = useState(() =>
		id ? getCachedElectionDetail(id) : null,
	);
	const [serverData, setServerData] = useState<
		Awaited<ReturnType<typeof getElectionDetail>> | undefined
	>(undefined);

	useEffect(() => {
		if (!id || typeof id !== "string") return;
		let cancelled = false;
		getElectionDetail(id).then((result) => {
			if (cancelled) return;
			setServerData(result);
			setCachedElectionDetail(id, result);
		});
		return () => {
			cancelled = true;
		};
	}, [id]);

	useLayoutEffect(() => {
		if (!id || typeof id !== "string") return;
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, [id]);

	useEffect(() => {
		if (id === null || id === "") {
			router.replace(`/${lang}/govern`);
			return;
		}
	}, [id, lang, router]);

	useEffect(() => {
		const handleScroll = () => {
			setShowScrollToTop(window.scrollY > 300);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	if (id === null || id === "") {
		return null;
	}

	const data = serverData ?? cachedData;
	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};
	const handleBack = () => {
		const fallbackPath = `/${lang}/govern`;
		const hasSameOriginReferrer =
			typeof document !== "undefined" &&
			document.referrer.startsWith(window.location.origin);

		if (window.history.length > 1 && hasSameOriginReferrer) {
			router.back();
			return;
		}

		router.push(fallbackPath);
	};

	if (data === undefined || data === null) {
		return <ElectionDetailPageSkeleton />;
	}

	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar
				title={dictionary.pages.govern.elections.detail.topbar_title}
				startAdornment={
					<button
						type="button"
						onClick={handleBack}
						className="flex size-10 items-center justify-center rounded-full bg-gray-100"
					>
						<PiCaretLeft className="size-4 text-gray-900" />
					</button>
				}
			/>

			<div className="flex flex-1 flex-col p-6">
				<ElectionDetailContent
					election={data.election}
					parties={data.parties}
					results={data.results}
					lang={lang}
					dictionary={dictionary}
				/>
			</div>

			<ScrollToTopButton show={showScrollToTop} onClick={scrollToTop} />
		</div>
	);
}
