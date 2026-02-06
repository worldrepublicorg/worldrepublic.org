import { getDictionary } from "@/app/[lang]/dictionaries";
import { getFeaturedElectionId } from "@/lib/actions/elections";
import PartyDetailPageClient from "./page-client";

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);
  const featuredElectionId = (await getFeaturedElectionId()) ?? undefined;

  return (
    <PartyDetailPageClient
      partyId={id}
      dictionary={dictionary}
      featuredElectionId={featuredElectionId}
    />
  );
}
