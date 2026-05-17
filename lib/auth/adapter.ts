import NeonAdapter from "@auth/neon-adapter";
import type { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import type { Adapter } from "next-auth/adapters";
import { getDbReadOnly } from "@/lib/db/connection";
import { authenticators } from "@/lib/db/schema";

export function createNeonAdapterWithWebAuthn(db: Pool): Adapter {
	const baseAdapter = NeonAdapter(db);

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
