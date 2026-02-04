import { redirect } from "next/navigation";

export default async function VoteRedirect({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Redirect old /vote URLs to root for backwards compatibility
  redirect(`/${lang}/`);
}
