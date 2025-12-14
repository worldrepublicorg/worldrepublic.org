import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Dictionary, getDictionary } from "@/app/[lang]/dictionaries";
import { PartiesPageSkeleton } from "@/components/parties/parties-page-skeleton";
import { getParties } from "@/lib/actions/parties";
import type { Party } from "@/lib/types/parties";
import PartiesPageClient from "./page-client";

// Cache parties list for 60 seconds - same for all users
// Invalidated via revalidateTag("parties-list") when parties change
const getCachedParties = unstable_cache(
  async () => getParties({ limit: 100 }),
  ["parties-list"],
  { revalidate: 60, tags: ["parties-list"] },
);

async function PartiesData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  // Fetch parties (public data, cached) - no auth needed
  const parties = await getCachedParties().catch((error) => {
    const errorDetails = {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      lang,
    };

    console.error(
      "[PartiesPage] Error fetching parties:",
      JSON.stringify(errorDetails, null, 2),
    );
    console.error("[PartiesPage] Raw error:", error);

    return [] as Party[];
  });

  return (
    <PartiesPageClient parties={parties} dictionary={dictionary} lang={lang} />
  );
}

export default async function PartiesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<PartiesPageSkeleton dictionary={dictionary} />}>
      <PartiesData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
