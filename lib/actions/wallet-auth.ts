"use server";

import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { SiweMessage } from "siwe";
import { createUserProfile } from "@/lib/actions/member";
import { auth } from "@/lib/auth";
import { createNeonAdapterWithWebAuthn } from "@/lib/auth/adapter";
import { db, getDbReadOnly, pool } from "@/lib/db/connection";
import { accounts, users, walletAuthNonces } from "@/lib/db/schema";
import {
  isAllowedWalletAuthChainId,
  isWalletAuthIntent,
  normalizeWalletAddress,
  WALLET_AUTH_NONCE_TTL_MS,
  WALLET_PROVIDER_ID,
  type WalletAuthIntent,
} from "@/lib/wallet-auth";

type WalletSiweChallengeResult =
  | {
      success: true;
      domain: string;
      uri: string;
      statement: string;
      chainId: number;
      nonce: string;
      issuedAt: string;
      expirationTime: string;
    }
  | {
      success: false;
      error: string;
    };

type VerifyWalletSiweParams = {
  message: string;
  signature: string;
  intent: WalletAuthIntent;
};

type VerifyWalletSiweResult =
  | {
      success: true;
      mode: WalletAuthIntent;
      walletAddress: string;
    }
  | {
      success: false;
      error:
        | "invalid_signature"
        | "invalid_chain"
        | "verification_failed"
        | "nonce_expired_or_used"
        | "wallet_already_linked"
        | "wallet_already_linked_on_this_account"
        | "unauthorized"
        | "invalid_payload";
    };

function getAuthOrigin() {
  const authUrl = process.env.NEXTAUTH_URL;
  if (!authUrl) {
    throw new Error("NEXTAUTH_URL must be set");
  }

  const parsed = new URL(authUrl);
  return {
    domain: parsed.host,
    uri: parsed.origin,
  };
}

function buildNonce(): string {
  return randomBytes(16).toString("hex");
}

async function createSessionForUser(userId: number): Promise<void> {
  const adapter = createNeonAdapterWithWebAuthn(pool);
  if (!adapter.createSession) {
    throw new Error("Adapter does not support createSession");
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const sessionToken = crypto.randomUUID();
  const session = await adapter.createSession({
    sessionToken,
    userId: String(userId),
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
}

export async function getWalletSiweChallenge(
  intent: string,
  chainId: number,
): Promise<WalletSiweChallengeResult> {
  try {
    if (!isWalletAuthIntent(intent) || !isAllowedWalletAuthChainId(chainId)) {
      return { success: false, error: "invalid_chain" };
    }

    const nonce = buildNonce();
    const issuedAt = new Date();
    const expirationTime = new Date(
      issuedAt.getTime() + WALLET_AUTH_NONCE_TTL_MS,
    );
    const { domain, uri } = getAuthOrigin();

    await db.insert(walletAuthNonces).values({
      nonce,
      chainId,
      intent,
      expiresAt: expirationTime,
    });

    return {
      success: true,
      domain,
      uri,
      statement: "Sign in to World Republic",
      chainId,
      nonce,
      issuedAt: issuedAt.toISOString(),
      expirationTime: expirationTime.toISOString(),
    };
  } catch (error) {
    console.error("Error creating wallet SIWE challenge:", error);
    return { success: false, error: "verification_failed" };
  }
}

export async function verifyWalletSiwe({
  message,
  signature,
  intent,
}: VerifyWalletSiweParams): Promise<VerifyWalletSiweResult> {
  try {
    if (!message || !signature || !isWalletAuthIntent(intent)) {
      return { success: false, error: "invalid_payload" };
    }

    const siweMessage = new SiweMessage(message);
    const now = new Date();
    const { domain, uri } = getAuthOrigin();

    if (!isAllowedWalletAuthChainId(siweMessage.chainId)) {
      return { success: false, error: "invalid_chain" };
    }

    if (siweMessage.uri !== uri) {
      return { success: false, error: "verification_failed" };
    }

    const [nonceRecord] = await getDbReadOnly()
      .select()
      .from(walletAuthNonces)
      .where(
        and(
          eq(walletAuthNonces.nonce, siweMessage.nonce),
          eq(walletAuthNonces.intent, intent),
        ),
      )
      .limit(1);

    if (
      !nonceRecord ||
      nonceRecord.consumedAt ||
      nonceRecord.expiresAt.getTime() <= now.getTime()
    ) {
      return { success: false, error: "nonce_expired_or_used" };
    }

    if (nonceRecord.chainId !== siweMessage.chainId) {
      return { success: false, error: "invalid_chain" };
    }

    if (nonceRecord.address) {
      const normalizedNonceAddress = normalizeWalletAddress(
        nonceRecord.address,
      );
      const normalizedMessageAddress = normalizeWalletAddress(
        siweMessage.address,
      );
      if (normalizedNonceAddress !== normalizedMessageAddress) {
        return { success: false, error: "verification_failed" };
      }
    }

    const verification = await siweMessage.verify(
      {
        signature,
        domain,
        nonce: nonceRecord.nonce,
        time: now.toISOString(),
      },
      { suppressExceptions: true },
    );

    if (!verification.success) {
      return { success: false, error: "invalid_signature" };
    }

    const consumedRows = await db
      .update(walletAuthNonces)
      .set({ consumedAt: now })
      .where(
        and(
          eq(walletAuthNonces.id, nonceRecord.id),
          isNull(walletAuthNonces.consumedAt),
          gt(walletAuthNonces.expiresAt, now),
        ),
      )
      .returning();

    if (consumedRows.length === 0) {
      return { success: false, error: "nonce_expired_or_used" };
    }

    const normalizedAddress = normalizeWalletAddress(siweMessage.address);
    const [existingWalletAccount] = await getDbReadOnly()
      .select({
        userId: accounts.userId,
      })
      .from(accounts)
      .where(
        and(
          eq(accounts.provider, WALLET_PROVIDER_ID),
          eq(accounts.providerAccountId, normalizedAddress),
        ),
      )
      .limit(1);

    if (intent === "link") {
      const session = await auth();
      if (!session?.user?.id) {
        return { success: false, error: "unauthorized" };
      }

      const authUserId = parseInt(String(session.user.id), 10);
      if (Number.isNaN(authUserId)) {
        return { success: false, error: "unauthorized" };
      }

      const [alreadyLinkedOnCurrentAccount] = await getDbReadOnly()
        .select({ id: accounts.id })
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, authUserId),
            eq(accounts.provider, WALLET_PROVIDER_ID),
          ),
        )
        .limit(1);

      if (alreadyLinkedOnCurrentAccount) {
        return {
          success: false,
          error: "wallet_already_linked_on_this_account",
        };
      }

      if (
        existingWalletAccount &&
        existingWalletAccount.userId !== authUserId
      ) {
        return { success: false, error: "wallet_already_linked" };
      }

      if (!existingWalletAccount) {
        await db.insert(accounts).values({
          userId: authUserId,
          type: "credentials",
          provider: WALLET_PROVIDER_ID,
          providerAccountId: normalizedAddress,
        });
      }

      return {
        success: true,
        mode: "link",
        walletAddress: normalizedAddress,
      };
    }

    if (existingWalletAccount) {
      await createSessionForUser(existingWalletAccount.userId);
      return {
        success: true,
        mode: "signin",
        walletAddress: normalizedAddress,
      };
    }

    const [newUser] = await db
      .insert(users)
      .values({
        name: "Wallet User",
      })
      .returning();

    if (!newUser?.id || !newUser.uuid) {
      return { success: false, error: "verification_failed" };
    }

    await createUserProfile(newUser.uuid, newUser.id);

    await db.insert(accounts).values({
      userId: newUser.id,
      type: "credentials",
      provider: WALLET_PROVIDER_ID,
      providerAccountId: normalizedAddress,
    });

    await createSessionForUser(newUser.id);

    return {
      success: true,
      mode: "signin",
      walletAddress: normalizedAddress,
    };
  } catch (error) {
    console.error("Error verifying wallet SIWE:", error);
    return { success: false, error: "verification_failed" };
  }
}
