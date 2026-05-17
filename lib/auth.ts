import "server-only";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import Passkey from "next-auth/providers/passkey";
import { cache } from "react";
import { createNeonAdapterWithWebAuthn } from "./auth/adapter";
import { getDbReadOnly, pool } from "./db/connection";
import { accounts } from "./db/schema";

const authSecret = process.env.NEXTAUTH_SECRET;
if (!authSecret) {
	throw new Error("AUTH_SECRET or NEXTAUTH_SECRET is not set");
}

const passkeyRpId =
	process.env.AUTH_WEBAUTHN_RP_ID ||
	(process.env.NODE_ENV === "development"
		? "localhost"
		: "www.worldrepublic.org");
const rpName = process.env.AUTH_WEBAUTHN_RP_NAME || "World Republic";

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (!googleClientId || !googleClientSecret) {
	throw new Error("AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be set");
}

// Create adapter immediately - postgres.js connections are lazy (only connect on query)
// This is safe because:
// - For localhost: postgres.js doesn't connect until a query is made
// - For remote: Pool connections are also lazy
const adapter = createNeonAdapterWithWebAuthn(pool);

const { handlers, auth: uncachedAuth } = NextAuth({
	adapter,
	trustHost: true,
	providers: [
		GoogleProvider({
			clientId: googleClientId,
			clientSecret: googleClientSecret,
			profile(profile) {
				// Do not persist Google profile fields in users table.
				return {
					id: profile.sub,
					email: null,
					name: null,
					image: null,
				};
			},
		}),
		// biome-ignore lint/suspicious/noExplicitAny: Type compatibility issue with next-auth@5.0.0-beta.30
		(Passkey as any)({
			rpName,
			rpID: passkeyRpId,
		}),
	],
	experimental: {
		enableWebAuthn: true,
	},
	session: {
		strategy: "database",
	},
	callbacks: {
		async signIn({ user, account }) {
			if (
				account?.provider === "google" &&
				account.providerAccountId &&
				user?.id
			) {
				const cookieStore = await cookies();
				const linkingUserId = cookieStore.get("auth-linking-intent")?.value;

				if (linkingUserId) {
					const targetUserId = parseInt(linkingUserId, 10);
					cookieStore.delete("auth-linking-intent");

					if (Number.isNaN(targetUserId)) {
						return "/en/menu/account?link=google&error=account_already_linked";
					}

					const readDb = getDbReadOnly();
					const [existingAccount] = await readDb
						.select({ userId: accounts.userId })
						.from(accounts)
						.where(
							and(
								eq(accounts.provider, "google"),
								eq(accounts.providerAccountId, account.providerAccountId),
							),
						)
						.limit(1);

					if (existingAccount && existingAccount.userId !== targetUserId) {
						return "/en/menu/account?link=google&error=account_already_linked";
					}

					if (!existingAccount && adapter.linkAccount) {
						await adapter.linkAccount({
							userId: String(targetUserId),
							type: account.type as "oauth",
							provider: account.provider,
							providerAccountId: account.providerAccountId,
							refresh_token: account.refresh_token ?? undefined,
							access_token: account.access_token ?? undefined,
							expires_at: account.expires_at ?? undefined,
							id_token: account.id_token ?? undefined,
							scope: account.scope ?? undefined,
							session_state: account.session_state as string | undefined,
							token_type: account.token_type ?? undefined,
						});
					}

					return "/en/menu/account?link=google";
				}
			}

			return true;
		},
		session({ session, user }) {
			if (session.user) {
				// Convert user.id (number from database) to string for consistency
				session.user.id = String(user.id);
			}
			return session;
		},
	},
});

// Cached auth - deduplicates calls within the same request
// Multiple components calling auth() in the same render will share the result
export const auth = cache(uncachedAuth);
export { handlers };
