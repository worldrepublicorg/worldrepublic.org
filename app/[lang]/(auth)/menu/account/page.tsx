import { eq } from "drizzle-orm";
import { Suspense } from "react";
import { Dictionary, getDictionary } from "@/app/[lang]/dictionaries";
import { AccountPageSkeleton } from "@/components/account/account-page-skeleton";
import { getUserProfile } from "@/lib/actions/member";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import AccountPageClient from "./page-client";

async function AccountProfileData({
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
  if (isAuthenticated && session?.user?.id) {
    // Get UUID from users table for display purposes
    const authUserId = parseInt(String(session.user.id), 10);
    const [user] = await db
      .select({ uuid: users.uuid })
      .from(users)
      .where(eq(users.id, authUserId))
      .limit(1);

    if (user?.uuid) {
      userUuid = user.uuid;
      const profileResult = await getUserProfile();
      if (profileResult.success && profileResult.profile) {
        profileData = {
          selfVerifiedAt: profileResult.profile.selfVerifiedAt || null,
          username: profileResult.profile.username || null,
          userId: session.user.id,
          userUuid: userUuid,
        };
      } else {
        // User exists but no profile yet - still pass UUID
        profileData = {
          selfVerifiedAt: null,
          username: null,
          userId: session.user.id,
          userUuid: userUuid,
        };
      }
    }
  }

  return (
    <AccountPageClient
      profileData={profileData}
      isAuthenticated={isAuthenticated}
      lang={lang}
      dictionary={dictionary}
    />
  );
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<AccountPageSkeleton dictionary={dictionary} />}>
      <AccountProfileData lang={lang} dictionary={dictionary} />
    </Suspense>
  );
}
