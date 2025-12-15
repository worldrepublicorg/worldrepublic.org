import NeonAdapter from "@auth/neon-adapter";
import { and, eq } from "drizzle-orm";
import type { Adapter } from "next-auth/adapters";
import { db, pool } from "@/lib/db/connection";
import { authenticators, verificationTokens } from "@/lib/db/schema";

// Neon adapter backed by the single Pool (WebSocket-based).
// Adds minimal overrides to normalize dates and support WebAuthn authenticators.
export function createNeonAdapterWithWebAuthn(): Adapter {
  const baseAdapter = NeonAdapter(pool);
  const drizzleDb = db;

  const convertExpires = (expires: unknown): Date => {
    if (expires instanceof Date) return expires;
    if (typeof expires === "string") return new Date(expires);
    return new Date(String(expires));
  };

  return {
    ...baseAdapter,

    async createSession(session) {
      if (!baseAdapter.createSession) {
        throw new Error("createSession not implemented on adapter");
      }
      const result = await baseAdapter.createSession(session);
      return { ...result, expires: convertExpires(result.expires) };
    },

    async getSessionAndUser(sessionToken) {
      const result = await baseAdapter.getSessionAndUser?.(sessionToken);
      if (!result) return null;
      return {
        ...result,
        session: {
          ...result.session,
          expires: convertExpires(result.session.expires),
        },
      };
    },

    async updateSession(session) {
      const result = await baseAdapter.updateSession?.(session);
      if (!result) return null;
      return { ...result, expires: convertExpires(result.expires) };
    },

    async getAccount(providerAccountId: string, provider: string) {
      return baseAdapter.getAccount
        ? baseAdapter.getAccount(providerAccountId, provider)
        : null;
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

    async createAuthenticator(authenticator) {
      const transportsValue =
        authenticator.transports && Array.isArray(authenticator.transports)
          ? JSON.stringify(authenticator.transports)
          : authenticator.transports
            ? String(authenticator.transports)
            : null;

      const [created] = await drizzleDb
        .insert(authenticators)
        .values({
          credentialID: authenticator.credentialID,
          userId: parseInt(authenticator.userId, 10),
          providerAccountId: authenticator.providerAccountId,
          credentialPublicKey: authenticator.credentialPublicKey,
          counter: authenticator.counter,
          credentialDeviceType: authenticator.credentialDeviceType,
          credentialBackedUp: authenticator.credentialBackedUp,
          transports: transportsValue,
        })
        .returning();

      return {
        credentialID: created.credentialID,
        userId: String(created.userId),
        providerAccountId: created.providerAccountId,
        credentialPublicKey: created.credentialPublicKey,
        counter: created.counter,
        credentialDeviceType: created.credentialDeviceType,
        credentialBackedUp: created.credentialBackedUp,
        transports: created.transports ? JSON.parse(created.transports) : null,
      };
    },

    async updateAuthenticatorCounter(credentialID: string, newCounter: number) {
      await drizzleDb
        .update(authenticators)
        .set({ counter: newCounter })
        .where(eq(authenticators.credentialID, credentialID));

      const [updated] = await drizzleDb
        .select()
        .from(authenticators)
        .where(eq(authenticators.credentialID, credentialID))
        .limit(1);

      if (!updated) {
        throw new Error("Authenticator not found");
      }

      return {
        credentialID: updated.credentialID,
        userId: String(updated.userId),
        providerAccountId: updated.providerAccountId,
        credentialPublicKey: updated.credentialPublicKey,
        counter: updated.counter,
        credentialDeviceType: updated.credentialDeviceType,
        credentialBackedUp: updated.credentialBackedUp,
        transports: updated.transports ? JSON.parse(updated.transports) : null,
      };
    },

    async deleteAuthenticator(credentialID: string): Promise<void> {
      await drizzleDb
        .delete(authenticators)
        .where(eq(authenticators.credentialID, credentialID));
    },

    async createVerificationToken(token) {
      const result = await baseAdapter.createVerificationToken?.(token);
      if (result) return result;
      const [created] = await drizzleDb
        .insert(verificationTokens)
        .values(token)
        .returning();
      return created;
    },

    async useVerificationToken(params) {
      if (baseAdapter.useVerificationToken) {
        return await baseAdapter.useVerificationToken(params);
      }

      const { identifier, token } = params;
      const [existing] = await drizzleDb
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        )
        .limit(1);

      if (!existing) return null;

      await drizzleDb
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token),
          ),
        );

      return existing;
    },
  } as Adapter;
}
