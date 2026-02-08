import { getDictionary } from "@/app/[lang]/dictionaries";
import WalletPageClient from "./page-client";

export default async function WalletPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return <WalletPageClient lang={lang} dictionary={dictionary} />;
}
