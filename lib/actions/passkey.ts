"use server";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { Buffer } from "buffer";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createUserProfile } from "@/lib/actions/member";
import { createNeonAdapterWithWebAuthn } from "@/lib/auth/adapter";
import { getDbReadOnly, pool } from "@/lib/db/connection";
import { accounts, authenticators, users } from "@/lib/db/schema";

function getRpId(): string {
  const authUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  try {
    const url = new URL(authUrl);
    return url.hostname;
  } catch {
    return "localhost";
  }
}

export async function getPasskeyOptions() {
  try {
    const rpId = getRpId();
    const db = getDbReadOnly();

    const allAuthenticators = await db
      .select({
        credentialID: authenticators.credentialID,
        userId: authenticators.userId,
        providerAccountId: authenticators.providerAccountId,
        credentialPublicKey: authenticators.credentialPublicKey,
        counter: authenticators.counter,
        credentialDeviceType: authenticators.credentialDeviceType,
        credentialBackedUp: authenticators.credentialBackedUp,
        transports: authenticators.transports,
      })
      .from(authenticators);

    const passkeyCount = allAuthenticators.length;

    // Build allowCredentials based on passkey count:
    // - 0 passkeys: omit allowCredentials (will trigger registration)
    // - 1 passkey: include it so browser verifies directly
    // - Multiple passkeys: include all so browser shows selection
    let allowCredentials:
      | Array<{
          id: Buffer;
          type: "public-key";
        }>
      | undefined;

    if (passkeyCount > 0) {
      allowCredentials = allAuthenticators.map((auth) => ({
        id: Buffer.from(auth.credentialID, "base64url"),
        type: "public-key" as const,
      }));
    }

    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials,
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

    const rpId = getRpId();
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
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
        name: users.name,
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

    const isProduction =
      process.env.NODE_ENV === "production" &&
      process.env.NEXTAUTH_URL?.startsWith("https");
    const cookieName = isProduction
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const cookieStore = await cookies();
    cookieStore.set(cookieName, session.sessionToken, {
      httpOnly: true,
      secure: isProduction,
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
    const rpId = getRpId();
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
  name?: string,
) {
  try {
    if (!credential || !challenge || !tempUserId) {
      return { error: "Missing required fields" };
    }

    const rpId = getRpId();
    const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

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
        name: name || tempEmail || "Anonymous User",
      })
      .returning();

    if (!newUser || !newUser.uuid) {
      return { error: "Failed to create user" };
    }

    // Create user profile immediately after user creation
    try {
      await createUserProfile(newUser.uuid, newUser.id);
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

    const isProduction =
      process.env.NODE_ENV === "production" &&
      process.env.NEXTAUTH_URL?.startsWith("https");
    const cookieName = isProduction
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const cookieStore = await cookies();
    cookieStore.set(cookieName, session.sessionToken, {
      httpOnly: true,
      secure: isProduction,
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
