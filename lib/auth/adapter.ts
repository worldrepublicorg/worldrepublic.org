import NeonAdapter from "@auth/neon-adapter";
import type { Pool } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Adapter } from "next-auth/adapters";
import { getDbReadOnly, getIsLocalhost } from "@/lib/db/connection";
import * as schema from "@/lib/db/schema";
import {
  accounts,
  authenticators,
  sessions,
  users,
  verificationTokens,
} from "@/lib/db/schema";

// Custom adapter for localhost using postgres.js (Neon Local Connect)
function createPostgresAdapter(): Adapter {
  const db = getDbReadOnly();

  return {
    async createUser(user) {
      const [created] = await db
        .insert(users)
        .values({
          name: user.name ?? null,
          email: user.email ?? null,
          emailVerified: user.emailVerified ?? null,
          image: user.image ?? null,
        })
        .returning();

      return {
        id: String(created.id),
        name: created.name ?? undefined,
        email: created.email ?? undefined,
        emailVerified: created.emailVerified ?? undefined,
        image: created.image ?? undefined,
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth AdapterUser expects non-nullable fields, but DB allows nulls
      } as any;
    },
    async getUser(id) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id, 10)))
        .limit(1);

      if (!user) return null;

      return {
        id: String(user.id),
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        emailVerified: user.emailVerified ?? undefined,
        image: user.image ?? undefined,
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth AdapterUser expects non-nullable fields, but DB allows nulls
      } as any;
    },
    async getUserByEmail(email) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) return null;

      return {
        id: String(user.id),
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        emailVerified: user.emailVerified ?? undefined,
        image: user.image ?? undefined,
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth AdapterUser expects non-nullable fields, but DB allows nulls
      } as any;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const [account] = await db
        .select({ userId: accounts.userId })
        .from(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        )
        .limit(1);

      if (!account) return null;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, account.userId))
        .limit(1);

      if (!user) return null;

      return {
        id: String(user.id),
        name: user.name ?? undefined,
        email: user.email ?? undefined,
        emailVerified: user.emailVerified ?? undefined,
        image: user.image ?? undefined,
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth AdapterUser expects non-nullable fields, but DB allows nulls
      } as any;
    },
    async updateUser(user) {
      const updateData: {
        name?: string | null;
        email?: string | null;
        emailVerified?: Date | null;
        image?: string | null;
      } = {};

      if (user.name !== undefined) updateData.name = user.name ?? null;
      if (user.email !== undefined) updateData.email = user.email ?? null;
      if (user.emailVerified !== undefined)
        updateData.emailVerified = user.emailVerified ?? null;
      if (user.image !== undefined) updateData.image = user.image ?? null;

      const [updated] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(user.id, 10)))
        .returning();

      if (!updated) throw new Error("User not found");

      return {
        id: String(updated.id),
        name: updated.name ?? undefined,
        email: updated.email ?? undefined,
        emailVerified: updated.emailVerified ?? undefined,
        image: updated.image ?? undefined,
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth AdapterUser expects non-nullable fields, but DB allows nulls
      } as any;
    },
    async linkAccount(account) {
      await db.insert(accounts).values({
        userId: parseInt(account.userId, 10),
        type: account.type,
        provider: account.provider,
        providerAccountId: account.providerAccountId,
        refresh_token: account.refresh_token ?? null,
        access_token: account.access_token ?? null,
        expires_at:
          account.expires_at && typeof account.expires_at === "number"
            ? account.expires_at
            : null,
        token_type: account.token_type ?? null,
        scope: account.scope ?? null,
        id_token: account.id_token ?? null,
        session_state: account.session_state ?? null,
        // biome-ignore lint/suspicious/noExplicitAny: Type assertion needed for expires_at bigint conversion
      } as any);
    },
    async createSession(session) {
      const [created] = await db
        .insert(sessions)
        .values({
          sessionToken: session.sessionToken,
          userId: parseInt(session.userId, 10),
          expires: session.expires,
        })
        .returning();

      return {
        sessionToken: created.sessionToken,
        userId: String(created.userId),
        expires:
          created.expires instanceof Date
            ? created.expires
            : new Date(created.expires),
      };
    },
    async getSessionAndUser(sessionToken) {
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .limit(1);

      if (!session || session.expires < new Date()) {
        return null;
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);

      if (!user) return null;

      return {
        session: {
          sessionToken: session.sessionToken,
          userId: String(session.userId),
          expires:
            session.expires instanceof Date
              ? session.expires
              : new Date(session.expires),
        },
        user: {
          id: String(user.id),
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          emailVerified: user.emailVerified ?? undefined,
          image: user.image ?? undefined,
        },
        // biome-ignore lint/suspicious/noExplicitAny: NextAuth adapter types expect non-nullable fields, but DB allows nulls
      } as any;
    },
    async updateSession(session) {
      const updateData: {
        userId?: number;
        expires?: Date;
      } = {};

      if (session.userId !== undefined) {
        updateData.userId = parseInt(session.userId, 10);
      }
      if (session.expires !== undefined) {
        updateData.expires =
          session.expires instanceof Date
            ? session.expires
            : new Date(session.expires);
      }

      const [updated] = await db
        .update(sessions)
        .set(updateData)
        .where(eq(sessions.sessionToken, session.sessionToken))
        .returning();

      if (!updated) return null;

      return {
        sessionToken: updated.sessionToken,
        userId: String(updated.userId),
        expires:
          updated.expires instanceof Date
            ? updated.expires
            : new Date(updated.expires),
      };
    },
    async deleteSession(sessionToken) {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },
    async createVerificationToken(verificationToken) {
      const [created] = await db
        .insert(verificationTokens)
        .values({
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        })
        .returning();

      return {
        identifier: created.identifier,
        token: created.token,
        expires: created.expires,
      };
    },
    async useVerificationToken({ identifier, token }) {
      const [vt] = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
        .limit(1);

      if (!vt) return null;

      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      return {
        identifier: vt.identifier,
        token: vt.token,
        expires: vt.expires,
      };
    },
    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, parseInt(userId, 10)));
    },
    async unlinkAccount({ providerAccountId, provider }) {
      await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, providerAccountId),
            eq(accounts.provider, provider),
          ),
        );
    },
  };
}

export function createNeonAdapterWithWebAuthn(db: Pool | null): Adapter {
  const isLocalhost = getIsLocalhost();

  // If LOCAL_DATABASE_URL is set, use custom adapter with postgres.js
  // Otherwise, use NeonAdapter with Pool for writes, but HTTP for reads (faster)
  const baseAdapter = isLocalhost
    ? createPostgresAdapter()
    : db
      ? NeonAdapter(db)
      : createPostgresAdapter(); // Fallback if db is null

  // Always use HTTP driver for reads (faster), even in production
  // Only use Pool for writes when needed
  const drizzleDb = getDbReadOnly();

  // Helper to convert expires to Date (NeonAdapter returns PostgreSQL timestamp strings)
  const convertExpires = (expires: unknown): Date => {
    if (expires instanceof Date) return expires;
    if (typeof expires === "string") return new Date(expires);
    return new Date(String(expires));
  };

  return {
    ...baseAdapter,
    // Override session methods to ensure expires is always a Date object
    // This fixes the issue where NeonAdapter returns PostgreSQL timestamp strings
    async createSession(session) {
      if (!baseAdapter.createSession) {
        throw new Error("Adapter does not support createSession");
      }
      const result = await baseAdapter.createSession(session);
      if (result) {
        return {
          ...result,
          expires: convertExpires(result.expires),
        };
      }
      return result;
    },
    async getSessionAndUser(sessionToken) {
      if (!baseAdapter.getSessionAndUser) {
        throw new Error("Adapter does not support getSessionAndUser");
      }
      const result = await baseAdapter.getSessionAndUser(sessionToken);
      if (result) {
        return {
          ...result,
          session: {
            ...result.session,
            expires: convertExpires(result.session.expires),
          },
        };
      }
      return result;
    },
    async updateSession(session) {
      if (!baseAdapter.updateSession) {
        throw new Error("Adapter does not support updateSession");
      }
      const result = await baseAdapter.updateSession(session);
      if (result) {
        return {
          ...result,
          expires: convertExpires(result.expires),
        };
      }
      return result;
    },
    async getAccount(providerAccountId: string, provider: string) {
      if (baseAdapter.getAccount) {
        return await baseAdapter.getAccount(providerAccountId, provider);
      }
      return null;
    },
    async getAuthenticator(credentialID: string) {
      const result = await drizzleDb
        .select()
        .from(authenticators)
        .where(eq(authenticators.credentialID, credentialID))
        .limit(1);

      if (result.length === 0) return null;

      const auth = result[0];
      return {
        credentialID: auth.credentialID,
        userId: String(auth.userId),
        providerAccountId: auth.providerAccountId,
        credentialPublicKey: auth.credentialPublicKey,
        counter: auth.counter,
        credentialDeviceType: auth.credentialDeviceType,
        credentialBackedUp: auth.credentialBackedUp,
        transports: auth.transports ? JSON.parse(auth.transports) : null,
      };
    },
    // biome-ignore lint/suspicious/noExplicitAny: AdapterAuthenticator type compatibility
    async createAuthenticator(authenticator: any) {
      const transportsValue =
        authenticator.transports && Array.isArray(authenticator.transports)
          ? JSON.stringify(authenticator.transports)
          : authenticator.transports
            ? String(authenticator.transports)
            : null;

      await drizzleDb.insert(authenticators).values({
        credentialID: authenticator.credentialID,
        userId: parseInt(authenticator.userId, 10),
        providerAccountId: authenticator.providerAccountId,
        credentialPublicKey: authenticator.credentialPublicKey,
        counter: authenticator.counter,
        credentialDeviceType: authenticator.credentialDeviceType,
        credentialBackedUp: authenticator.credentialBackedUp,
        transports: transportsValue,
      });
      return authenticator;
    },
    async listAuthenticatorsByUserId(userId: string) {
      const result = await drizzleDb
        .select()
        .from(authenticators)
        .where(eq(authenticators.userId, parseInt(userId, 10)));

      return result.map((auth) => ({
        credentialID: auth.credentialID,
        userId: String(auth.userId),
        providerAccountId: auth.providerAccountId,
        credentialPublicKey: auth.credentialPublicKey,
        counter: auth.counter,
        credentialDeviceType: auth.credentialDeviceType,
        credentialBackedUp: auth.credentialBackedUp,
        transports: auth.transports ? JSON.parse(auth.transports) : null,
      }));
    },
    async updateAuthenticatorCounter(credentialID: string, counter: number) {
      await drizzleDb
        .update(authenticators)
        .set({ counter })
        .where(eq(authenticators.credentialID, credentialID));

      const result = await drizzleDb
        .select()
        .from(authenticators)
        .where(eq(authenticators.credentialID, credentialID))
        .limit(1);

      if (result.length === 0) {
        throw new Error(
          `Authenticator with credentialID ${credentialID} not found`,
        );
      }

      const auth = result[0];
      return {
        credentialID: auth.credentialID,
        userId: String(auth.userId),
        providerAccountId: auth.providerAccountId,
        credentialPublicKey: auth.credentialPublicKey,
        counter: auth.counter,
        credentialDeviceType: auth.credentialDeviceType,
        credentialBackedUp: auth.credentialBackedUp,
        transports: auth.transports ? JSON.parse(auth.transports) : null,
      };
    },
  };
}
