import { Suspense } from "react";
import { getDictionary, locales } from "@/app/[lang]/dictionaries";
import { MenuLink } from "@/components/menu-link";
import { TopBar } from "@/components/topbar";
import { VotePageSkeleton } from "@/components/vote/vote-page-skeleton";
import { VotePageClient } from "./page-client";

// This enables Static Site Generation (SSG) for all languages
export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function VotePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.world_republic}
        endAdornment={<MenuLink lang={lang} />}
      />
      {/* Suspense is required when using useSearchParams in a Client Component
          embedded in a statically generated page */}
      <Suspense
        fallback={<VotePageSkeleton dictionary={dictionary} lang={lang} />}
      >
        <VotePageClient lang={lang} dictionary={dictionary} />
      </Suspense>
    </div>
  );
}
