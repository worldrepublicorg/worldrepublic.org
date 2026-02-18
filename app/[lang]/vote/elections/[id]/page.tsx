import { getDictionary } from "@/app/[lang]/dictionaries";
import ElectionDetailPageClient from "./page-client";

export default async function ElectionDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <ElectionDetailPageClient
      id={id}
      lang={lang}
      dictionary={dictionary}
    />
  );
}
