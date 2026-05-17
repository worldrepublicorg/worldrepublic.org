"use server";

import { Buffer } from "node:buffer";
import {
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { createUserProfile } from "@/lib/actions/member";
import { auth } from "@/lib/auth";
import { createNeonAdapterWithWebAuthn } from "@/lib/auth/adapter";
import { getDbReadOnly, pool } from "@/lib/db/connection";
import { accounts, authenticators, users } from "@/lib/db/schema";

const DEFAULT_PASSKEY_HOSTS = [
	"www.worldrepublic.org",
	"www.raisedbyhumanity.org",
	"localhost",
];

function normalizeHost(host: string | null | undefined): string {
	if (!host) return "";
	const firstHost = host.split(",")[0]?.trim() ?? "";
	const withoutProtocol = firstHost.replace(/^https?:\/\//, "");
	const withoutPath = withoutProtocol.split("/")[0] ?? "";
	const withoutPort = withoutPath.replace(/:\d+$/, "");
	return withoutPort.toLowerCase();
}

function getAllowedPasskeyHosts(): string[] {
	const configuredHosts = (process.env.AUTH_WEBAUTHN_ALLOWED_HOSTS ?? "")
		.split(",")
		.map((host) => normalizeHost(host))
		.filter((host) => host.length > 0);
	const defaultRpId = normalizeHost(process.env.AUTH_WEBAUTHN_RP_ID);

	return [
		...new Set(
			[defaultRpId, ...configuredHosts, ...DEFAULT_PASSKEY_HOSTS].filter(
				(host) => host.length > 0,
			),
		),
	];
}

function getRequestProtocol(requestHeaders: Headers): "http" | "https" {
	const forwardedProto = requestHeaders
		.get("x-forwarded-proto")
		?.split(",")[0]
		?.trim()
		.toLowerCase();

	if (forwardedProto === "http" || forwardedProto === "https") {
		return forwardedProto;
	}

	return process.env.NODE_ENV === "production" ? "https" : "http";
}

async function getWebAuthnContext() {
	const requestHeaders = await headers();
	const hostHeader =
		requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
	const hostWithPort = hostHeader
		?.split(",")[0]
		?.trim()
		.replace(/^https?:\/\//, "")
		.split("/")[0];
	const normalizedHost = normalizeHost(hostWithPort);
	const allowedHosts = getAllowedPasskeyHosts();

	if (!normalizedHost || !allowedHosts.includes(normalizedHost)) {
		throw new Error("Unsupported host for passkey authentication");
	}

	const protocol = getRequestProtocol(requestHeaders);
	const fallbackOrigin = `${protocol}://${hostWithPort ?? normalizedHost}`;
	const originHeader = requestHeaders.get("origin");

	let expectedOrigin = fallbackOrigin;
	if (originHeader) {
		try {
			const parsedOrigin = new URL(originHeader);
			if (normalizeHost(parsedOrigin.host) === normalizedHost) {
				expectedOrigin = parsedOrigin.origin;
			}
		} catch {
			expectedOrigin = fallbackOrigin;
		}
	}

	return {
		rpId: normalizedHost,
		expectedOrigin,
		secureCookies:
			process.env.NODE_ENV === "production" &&
			expectedOrigin.startsWith("https://"),
	};
}

export async function getPasskeyOptions() {
	try {
		const { rpId } = await getWebAuthnContext();
		const db = getDbReadOnly();

		// Count existing passkeys so the client knows whether to offer
		// "Sign in" vs "Create account"
		const allAuthenticators = await db
			.select({ credentialID: authenticators.credentialID })
			.from(authenticators);

		const passkeyCount = allAuthenticators.length;

		// Use discoverable credential flow: omit allowCredentials entirely.
		// All passkeys are registered with requireResidentKey: true, so the
		// browser/OS can discover them by rpId alone. This is more reliable on
		// mobile (Android Credential Manager, iOS) than sending an explicit
		// allowCredentials list which requires exact credential-ID matching.
		const options = await generateAuthenticationOptions({
			rpID: rpId,
			userVerification: "preferred",
		});

		return {
			success: true,
			...options,
			hasCredentials: passkeyCount > 0,
			passkeyCount,
		};
	} catch (error) {
		console.error("Error generating authentication options:", error);
		return {
			error: "Failed to generate authentication options",
			details:
				process.env.NODE_ENV === "development" && error instanceof Error
					? error.message
					: undefined,
		};
	}
}

export async function verifyPasskeyAuthentication(
	credential: unknown,
	challenge: string,
) {
	try {
		if (!credential || !challenge) {
			return { error: "Missing credential or challenge" };
		}

		const {
			rpId,
			expectedOrigin: origin,
			secureCookies,
		} = await getWebAuthnContext();
		const db = getDbReadOnly();
		const credentialIdString = (credential as { id: string }).id;

		const [authenticator] = await db
			.select()
			.from(authenticators)
			.where(eq(authenticators.credentialID, credentialIdString))
			.limit(1);

		if (!authenticator) {
			return { error: "Authenticator not found" };
		}

		const verification = await verifyAuthenticationResponse({
			response: credential as Parameters<
				typeof verifyAuthenticationResponse
			>[0]["response"],
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpId,
			authenticator: {
				credentialID: Buffer.from(authenticator.credentialID, "base64url"),
				credentialPublicKey: Buffer.from(
					authenticator.credentialPublicKey,
					"base64",
				),
				counter: authenticator.counter,
			},
			requireUserVerification: false,
		});

		if (!verification.verified) {
			return { error: "Authentication verification failed" };
		}

		await db
			.update(authenticators)
			.set({ counter: verification.authenticationInfo.newCounter })
			.where(eq(authenticators.credentialID, credentialIdString));

		const [user] = await db
			.select({
				id: users.id,
				email: users.email,
				emailVerified: users.emailVerified,
				image: users.image,
			})
			.from(users)
			.where(eq(users.id, authenticator.userId))
			.limit(1);

		if (!user) {
			return { error: "User not found" };
		}

		const adapter = createNeonAdapterWithWebAuthn(pool);
		const expires = new Date();
		expires.setDate(expires.getDate() + 30);

		if (!adapter.createSession) {
			throw new Error("Adapter does not support createSession");
		}

		const sessionToken = crypto.randomUUID();
		const session = await adapter.createSession({
			sessionToken,
			userId: String(user.id),
			expires,
		});

		const cookieName = secureCookies
			? "__Secure-authjs.session-token"
			: "authjs.session-token";

		const cookieStore = await cookies();
		cookieStore.set(cookieName, session.sessionToken, {
			httpOnly: true,
			secure: secureCookies,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		return {
			verified: true,
			userId: user.id,
			email: user.email,
		};
	} catch (error) {
		console.error("Error verifying authentication:", error);
		return { error: "Failed to verify authentication" };
	}
}

export async function getPasskeyRegistrationOptions(
	email: string | null,
	name?: string,
) {
	try {
		const { rpId } = await getWebAuthnContext();
		const rpName = process.env.AUTH_WEBAUTHN_RP_NAME || "World Republic";

		// Always create a new account for registration
		// This allows users to manage multiple passwordless accounts from the same device
		const userId = email
			? `citizen_${Buffer.from(email).toString("base64url")}`
			: `citizen_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		const userName = name || email || userId;
		const userDisplayName = name || email || "User";

		// Don't exclude credentials - allow the browser to offer creating new passkeys
		// even if the device already has one. We'll check for duplicates at verification time.
		// This allows users to create multiple accounts from the same device.
		const options = await generateRegistrationOptions({
			rpName,
			rpID: rpId,
			userID: userId,
			userName,
			userDisplayName,
			timeout: 60000,
			attestationType: "none",
			// Omit excludeCredentials to allow creating new passkeys on the same device
			authenticatorSelection: {
				// Don't restrict to platform only - allow both platform and cross-platform
				// This allows users to create multiple passkeys on the same device
				userVerification: "preferred",
				requireResidentKey: true,
			},
			supportedAlgorithmIDs: [-7, -257],
		});

		return {
			success: true,
			...options,
			tempUserId: userId,
			tempEmail: email || null,
		};
	} catch (error) {
		console.error("Error generating registration options:", error);
		return { error: "Failed to generate registration options" };
	}
}

export async function verifyPasskeyRegistration(
	credential: unknown,
	challenge: string,
	tempUserId: string,
	tempEmail: string | null,
	pendingReferralCode?: string,
) {
	try {
		if (!credential || !challenge || !tempUserId) {
			return { error: "Missing required fields" };
		}

		const {
			rpId,
			expectedOrigin: origin,
			secureCookies,
		} = await getWebAuthnContext();

		const verification = await verifyRegistrationResponse({
			response: credential as Parameters<
				typeof verifyRegistrationResponse
			>[0]["response"],
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpId,
			requireUserVerification: false,
		});

		if (!verification.verified || !verification.registrationInfo) {
			return { error: "Registration verification failed" };
		}

		const { credentialID, credentialPublicKey, counter } =
			verification.registrationInfo;

		const credentialIDString = Buffer.from(credentialID).toString("base64url");
		const credentialPublicKeyString =
			Buffer.from(credentialPublicKey).toString("base64");
		const transports = (
			credential as {
				response: { getTransports?: () => string[] | null };
			}
		).response.getTransports
			? (
					credential as {
						response: { getTransports: () => string[] | null };
					}
				).response.getTransports()
			: null;

		const db = getDbReadOnly();

		// Always create a new user account for registration
		// This allows users to manage multiple passwordless accounts from the same device
		const [newUser] = await db
			.insert(users)
			.values({
				email: tempEmail || null,
			})
			.returning();

		if (!newUser?.uuid) {
			return { error: "Failed to create user" };
		}

		// Create user profile immediately after user creation
		try {
			await createUserProfile(newUser.uuid, newUser.id, pendingReferralCode);
		} catch (error) {
			console.error("Error creating user profile:", error);
			// Don't fail registration if profile creation fails - it will be created lazily later
		}

		// Check if this credential already exists (shouldn't happen due to excludeCredentials, but safety check)
		const existingAuth = await db
			.select({ credentialID: authenticators.credentialID })
			.from(authenticators)
			.where(eq(authenticators.credentialID, credentialIDString))
			.limit(1);

		if (existingAuth.length === 0) {
			await db.insert(authenticators).values({
				credentialID: credentialIDString,
				userId: newUser.id,
				providerAccountId: credentialIDString,
				credentialPublicKey: credentialPublicKeyString,
				counter,
				credentialDeviceType: "singleDevice",
				credentialBackedUp:
					verification.registrationInfo.credentialBackedUp || false,
				transports: transports ? JSON.stringify(transports) : null,
			});

			await db.insert(accounts).values({
				userId: newUser.id,
				type: "webauthn",
				provider: "passkey",
				providerAccountId: credentialIDString,
			});
		}

		const adapter = createNeonAdapterWithWebAuthn(pool);
		const expires = new Date();
		expires.setDate(expires.getDate() + 30);

		if (!adapter.createSession) {
			throw new Error("Adapter does not support createSession");
		}

		// Always create a new session for the newly registered account
		const sessionToken = crypto.randomUUID();
		const session = await adapter.createSession({
			sessionToken,
			userId: String(newUser.id),
			expires,
		});

		const cookieName = secureCookies
			? "__Secure-authjs.session-token"
			: "authjs.session-token";

		const cookieStore = await cookies();
		cookieStore.set(cookieName, session.sessionToken, {
			httpOnly: true,
			secure: secureCookies,
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 30,
			path: "/",
		});

		return {
			verified: true,
			userId: newUser.id,
			email: newUser.email,
		};
	} catch (error) {
		console.error("Error verifying registration:", error);

		// Return specific error message for database connection failures
		if (
			error instanceof Error &&
			error.message.includes("Database connection failed")
		) {
			return { error: error.message };
		}

		return { error: "Failed to verify registration" };
	}
}

export async function setLinkingIntent() {
	const session = await auth();
	if (!session?.user?.id) {
		return { error: "Not authenticated" };
	}

	const cookieStore = await cookies();
	const { secureCookies } = await getWebAuthnContext();

	cookieStore.set("auth-linking-intent", session.user.id, {
		httpOnly: true,
		secure: secureCookies,
		sameSite: "lax",
		maxAge: 300,
		path: "/",
	});

	return { success: true };
}

export async function linkPasskeyToAccount(
	credential: unknown,
	challenge: string,
	tempUserId: string,
) {
	try {
		if (!credential || !challenge || !tempUserId) {
			return { error: "Missing required fields" };
		}

		const session = await auth();
		if (!session?.user?.id) {
			return { error: "Session expired, please sign in again." };
		}

		const authUserId = parseInt(String(session.user.id), 10);
		if (Number.isNaN(authUserId)) {
			return { error: "Session expired, please sign in again." };
		}

		const { rpId, expectedOrigin: origin } = await getWebAuthnContext();

		const verification = await verifyRegistrationResponse({
			response: credential as Parameters<
				typeof verifyRegistrationResponse
			>[0]["response"],
			expectedChallenge: challenge,
			expectedOrigin: origin,
			expectedRPID: rpId,
			requireUserVerification: false,
		});

		if (!verification.verified || !verification.registrationInfo) {
			return { error: "Registration verification failed" };
		}

		const { credentialID, credentialPublicKey, counter } =
			verification.registrationInfo;
		const credentialIDString = Buffer.from(credentialID).toString("base64url");
		const credentialPublicKeyString =
			Buffer.from(credentialPublicKey).toString("base64");
		const transports = (
			credential as {
				response: { getTransports?: () => string[] | null };
			}
		).response.getTransports
			? (
					credential as {
						response: { getTransports: () => string[] | null };
					}
				).response.getTransports()
			: null;

		const db = getDbReadOnly();
		const [existingAuthenticator] = await db
			.select({ credentialID: authenticators.credentialID })
			.from(authenticators)
			.where(eq(authenticators.credentialID, credentialIDString))
			.limit(1);

		if (existingAuthenticator) {
			return { error: "This passkey is already linked to an account." };
		}

		await db.insert(authenticators).values({
			credentialID: credentialIDString,
			userId: authUserId,
			providerAccountId: credentialIDString,
			credentialPublicKey: credentialPublicKeyString,
			counter,
			credentialDeviceType: "singleDevice",
			credentialBackedUp:
				verification.registrationInfo.credentialBackedUp || false,
			transports: transports ? JSON.stringify(transports) : null,
		});

		await db.insert(accounts).values({
			userId: authUserId,
			type: "webauthn",
			provider: "passkey",
			providerAccountId: credentialIDString,
		});

		return { verified: true };
	} catch (error) {
		console.error("Error linking passkey:", error);
		return { error: "Failed to link passkey" };
	}
}
