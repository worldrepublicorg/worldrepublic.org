import { getDictionary } from "@/app/[lang]/dictionaries";
import PartyDetailPageClient from "./page-client";

export default async function PartyDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return <PartyDetailPageClient partyId={id} dictionary={dictionary} />;
}
