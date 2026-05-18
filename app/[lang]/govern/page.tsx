import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import {
	type Dictionary,
	getDictionary,
	locales,
} from "@/app/[lang]/dictionaries";
import { GovernPageSkeleton } from "@/components/govern/govern-page-skeleton";
import { getElections } from "@/lib/actions/elections";
import { getParties } from "@/lib/actions/parties";
import type { Election } from "@/lib/types/elections";
import type { Party } from "@/lib/types/parties";
import GovernPageClient from "./page-client";

// Cache elections list for 1 day
const getCachedElections = unstable_cache(
	async () => {
		return await getElections();
	},
	["elections-list"],
	{ revalidate: 86400, tags: ["elections-list"] },
);

// Cache parties list for 1 day - same for all users
// Invalidated via revalidateTag("parties-list") when parties change
const getCachedParties = unstable_cache(
	async () => {
		const parties = await getParties({ limit: 100 });
		// If parties is null (error), return empty array but log it
		// ideally we would want to not cache this, but unstable_cache doesn't support conditional caching
		if (parties === null) {
			throw new Error("Failed to fetch parties");
		}
		return parties;
	},
	["parties-list"],
	{ revalidate: 86400, tags: ["parties-list"] },
);

export async function generateStaticParams() {
	return locales.map((lang) => ({ lang }));
}

async function GovernData({
	lang,
	dictionary,
}: {
	lang: string;
	dictionary: Dictionary;
}) {
	const elections: Election[] = await getCachedElections();
	let parties: Party[] | null = [];

	try {
		parties = await getCachedParties();
	} catch (error) {
		const errorDetails = {
			errorType: error instanceof Error ? error.constructor.name : typeof error,
			errorMessage: error instanceof Error ? error.message : String(error),
			timestamp: new Date().toISOString(),
			lang,
		};

		console.error(
			"[GovernPage] Error fetching parties:",
			JSON.stringify(errorDetails, null, 2),
		);
		// Explicitly set to null to signal error state to client
		parties = null;
	}

	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<GovernPageClient
				elections={elections}
				parties={parties}
				dictionary={dictionary}
				lang={lang}
			/>
		</div>
	);
}

export default async function GovernPage({
	params,
}: {
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;
	const dictionary = await getDictionary(lang);

	return (
		<Suspense fallback={<GovernPageSkeleton />}>
			<GovernData lang={lang} dictionary={dictionary} />
		</Suspense>
	);
}
