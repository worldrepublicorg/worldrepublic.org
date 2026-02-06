import { eq } from "drizzle-orm";
import { Suspense } from "react";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { WalletPageSkeleton } from "@/components/wallet/wallet-page-skeleton";
import { getTransactions, getUserProfile } from "@/lib/actions/member";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import WalletPageClient from "./page-client";

async function WalletProfileData({
  lang,
  dictionary,
}: {
  lang: string;
  dictionary: Dictionary;
}) {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  let profileData = null;
  let userUuid: string | null = null;
  let transactionsData = null;

  if (isAuthenticated && session?.user?.id) {
    // Get UUID from users table for display purposes
    const authUserId = parseInt(String(session.user.id), 10);

    // Fetch all data in parallel to avoid blocking Suspense
    const [userResult, profileResult, transactionsResult] = await Promise.all([
      db
        .select({ uuid: users.uuid })
        .from(users)
        .where(eq(users.id, authUserId))
        .limit(1)
        .then(([user]) => user || null),
      getUserProfile(),
      getTransactions(100),
    ]);

    if (userResult?.uuid) {
      userUuid = userResult.uuid;

      if (profileResult.success && profileResult.profile) {
        profileData = {
          walletBalance: profileResult.profile.walletBalance ?? null,
          selfVerifiedAt: profileResult.profile.selfVerifiedAt || null,
          username: profileResult.profile.username || null,
          userId: session.user.id,
          userUuid: userUuid,
        };
      } else {
        // User exists but no profile yet - still pass UUID
        profileData = {
          walletBalance: null,
          selfVerifiedAt: null,
          username: null,
          userId: session.user.id,
          userUuid: userUuid,
        };
      }

      // Set transactions data
      if (transactionsResult.success) {
        transactionsData = transactionsResult.transactions || [];
      }
    }
  }

  return (
    <WalletPageClient
      profileData={profileData}
      isAuthenticated={isAuthenticated}
      lang={lang}
      dictionary={dictionary}
      transactions={transactionsData}
    />
  );
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<WalletPageSkeleton dictionary={dictionary} />}>
      <WalletProfileData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
