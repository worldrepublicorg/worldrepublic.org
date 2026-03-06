"use server";

import { and, asc, desc, eq, gt, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db, getDbReadOnly } from "@/lib/db/connection";
import {
  parties,
  referrals,
  streams,
  transactions,
  userProfiles,
  users,
} from "@/lib/db/schema";
import {
  type StreamData,
  computeStreamAccrued,
  computeWalletBalance,
} from "@/lib/streams";
import { validateUsername } from "@/lib/utils";

// ============================================================================
// Helper Functions
// ============================================================================

// Helper function to generate a unique username
// Format: citizen_12345678 (8 chars base36 = 2.8 trillion combinations)
function generateUniqueUsername(): string {
  // Use base36 (0-9, a-z) for 8 characters = 2.8 trillion combinations
  const randomSuffix = Math.random().toString(36).substring(2, 10); // 8 chars
  return `citizen_${randomSuffix}`;
}

const REFERRAL_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // No ambiguous 0/O/1/I/L

function generateReferralCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += REFERRAL_CHARSET[Math.floor(Math.random() * REFERRAL_CHARSET.length)];
  }
  return code;
}

// Helper function to get user UUID from session
async function getUserUuidFromSession(): Promise<string> {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    throw new Error("Authentication required");
  }

  const authUserId = parseInt(String(session.user.id), 10);

  // Get UUID from users table
  const [user] = await db
    .select({ uuid: users.uuid })
    .from(users)
    .where(eq(users.id, authUserId))
    .limit(1);

  if (!user || !user.uuid) {
    throw new Error("User UUID not found");
  }

  return user.uuid;
}

// Helper function to verify user authentication and get UUID
async function verifyUserAccess(userUuid: string) {
  const uuid = await getUserUuidFromSession();

  if (uuid !== userUuid) {
    throw new Error("Unauthorized access");
  }

  return {
    userUuid: uuid,
    isAuthenticated: true,
  };
}

// ============================================================================
// Profile & Account Management
// ============================================================================

/**
 * Creates a user profile for a newly registered user.
 * Generates a random username and referral code. Optionally records a referral
 * relationship if the new user arrived via an ambassador's referral link.
 * @param userUuid - UUID of the user from the users table
 * @param authUserId - Auth user ID (numeric ID from users table)
 * @param pendingReferralCode - Optional referral code from the ambassador who referred this user
 * @returns The created profile or null if creation failed
 */
export async function createUserProfile(
  userUuid: string,
  authUserId: number,
  pendingReferralCode?: string,
): Promise<typeof userProfiles.$inferSelect | null> {
  const dbReadOnly = getDbReadOnly();

  // Check if profile already exists
  const [existing] = await dbReadOnly
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userUuid))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Generate a unique username
  let username: string | null = null;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    username = generateUniqueUsername();

    const [existingUsername] = await dbReadOnly
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(sql`LOWER(${userProfiles.username}) = ${username.toLowerCase()}`)
      .limit(1);

    if (!existingUsername) {
      isUnique = true;
    } else {
      attempts++;
      username = null;
    }
  }

  if (!isUnique || !username) {
    throw new Error("Could not generate unique username.");
  }

  // Generate a unique referral code (retry on collision, though astronomically unlikely)
  let referralCode = generateReferralCode();
  for (let i = 0; i < maxAttempts; i++) {
    const [existingCode] = await dbReadOnly
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.referralCode, referralCode))
      .limit(1);
    if (!existingCode) break;
    referralCode = generateReferralCode();
    if (i === maxAttempts - 1) {
      throw new Error("Could not generate unique referral code.");
    }
  }

  // Create the profile row
  await db.insert(userProfiles).values({
    id: userUuid,
    authUserId,
    username,
    referralCode,
    walletBalance: "0",
  });

  // Record referral relationship if a valid referral code was provided
  if (pendingReferralCode) {
    try {
      const [referrer] = await dbReadOnly
        .select({ id: userProfiles.id })
        .from(userProfiles)
        .where(eq(userProfiles.referralCode, pendingReferralCode))
        .limit(1);

      if (referrer && referrer.id !== userUuid) {
        await db
          .insert(referrals)
          .values({
            referrerId: referrer.id,
            referredId: userUuid,
          })
          .onConflictDoNothing({ target: referrals.referredId });

        revalidateTag("ambassador-leaderboard", "default");
      }
    } catch (error) {
      console.error("Error recording referral:", error);
    }
  }

  // Re-fetch the newly created profile using the read replica
  const [profile] = await dbReadOnly
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userUuid))
    .limit(1);

  return profile || null;
}

export async function getUserProfile(pendingReferralCode?: string) {
  try {
    // Get user UUID from authenticated session
    const userUuid = await getUserUuidFromSession();

    // Query PostgreSQL by UUID
    const dbReadOnly = getDbReadOnly();
    let [profile] = await dbReadOnly
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userUuid))
      .limit(1);

    // Lazily create a user profile with an auto-generated username if it doesn't exist yet
    if (!profile) {
      const { auth } = await import("@/lib/auth");
      const session = await auth();

      if (!session?.user?.id) {
        throw new Error("Authentication required");
      }

      const authUserId = parseInt(String(session.user.id), 10);

      const newProfile = await createUserProfile(
        userUuid,
        authUserId,
        pendingReferralCode,
      );

      if (!newProfile) {
        throw new Error("Failed to create user profile");
      }

      profile = newProfile;
    }

    // Ensure we have a profile at this point
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Convert PostgreSQL profile to expected format
    return {
      success: true,
      profile: {
        walletBalance: profile.walletBalance
          ? parseFloat(profile.walletBalance)
          : undefined,
        username: profile.username || undefined,
        referralCode: profile.referralCode || undefined,
        accountDeletedAt: profile.accountDeletedAt
          ? profile.accountDeletedAt.getTime()
          : undefined,
      },
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: "Could not fetch user profile." };
  }
}

export async function deleteUserAccount(userUuid: string) {
  if (!userUuid) {
    return { success: false, error: "A user UUID must be provided." };
  }

  // Verify user can only delete their own account
  await verifyUserAccess(userUuid);

  try {
    // Get user profile before deletion
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userUuid))
      .limit(1);

    if (!profile) {
      return { success: false, error: "User account not found." };
    }

    // Use PostgreSQL transaction for atomic soft delete
    await db.transaction(async (tx) => {
      // Soft delete: set accountDeletedAt and clear sensitive data
      await tx
        .update(userProfiles)
        .set({
          accountDeletedAt: new Date(),
          walletBalance: "0",
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userUuid));
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not delete account.",
    };
  }
}

// ============================================================================
// Wallet auth + data (client-only wallet page)
// ============================================================================

export type GetWalletAuthAndDataProfileData = {
  walletBalance: number | null;
  username: string | null;
  referralCode: string | null;
  userId: string;
  userUuid: string | null;
};

export type GetWalletAuthAndDataTransaction = {
  id: number;
  type: string;
  amount: number;
  walletAddress?: string;
  selectedChain?: string;
  recipientUserId?: string;
  streamType?: string;
  streamId?: string;
  createdAt: number;
  isReceived: boolean;
};

export type GetWalletAuthAndDataResult = {
  authenticated: boolean;
  profileData: GetWalletAuthAndDataProfileData | null;
  transactions: GetWalletAuthAndDataTransaction[] | null;
  streams: StreamData[] | null;
  email: string | null;
};

async function getUserStreamsByUuid(userUuid: string): Promise<StreamData[]> {
  const readDb = getDbReadOnly();
  const rows = await readDb
    .select()
    .from(streams)
    .where(eq(streams.userId, userUuid))
    .orderBy(asc(streams.startedAt));

  return rows.map((r) => ({
    id: r.id,
    type: r.type as "SUBSIDY" | "AMBASSADOR",
    totalAmount: Number.parseFloat(r.totalAmount),
    initialAmount: Number.parseFloat(r.initialAmount),
    withdrawnAmount: Number.parseFloat(r.withdrawnAmount),
    ratePerSecond: Number.parseFloat(r.ratePerSecond),
    startedAt: r.startedAt.getTime(),
    endsAt: r.endsAt.getTime(),
    partyId: r.partyId,
    electionId: r.electionId,
  }));
}

export async function getUserStreams(): Promise<StreamData[]> {
  const userUuid = await getUserUuidFromSession();
  return getUserStreamsByUuid(userUuid);
}

export async function getWalletAuthAndData(
  pendingReferralCode?: string,
): Promise<GetWalletAuthAndDataResult> {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  if (!isAuthenticated || !session?.user?.id) {
    return {
      authenticated: false,
      profileData: null,
      transactions: null,
      streams: null,
      email: null,
    };
  }

  const authUserId = parseInt(String(session.user.id), 10);

  const [userResult, profileResult, transactionsResult] = await Promise.all([
    db
      .select({ uuid: users.uuid })
      .from(users)
      .where(eq(users.id, authUserId))
      .limit(1)
      .then(([user]) => user || null),
    getUserProfile(pendingReferralCode),
    getTransactions(100),
  ]);

  const userUuid = userResult?.uuid ?? null;
  if (!userUuid) {
    return {
      authenticated: true,
      profileData: null,
      transactions: null,
      streams: null,
      email: session.user?.email ?? null,
    };
  }

  const userStreams = await getUserStreamsByUuid(userUuid);

  // Compute wallet balance from streams
  const walletBalance =
    userStreams.length > 0
      ? computeWalletBalance(userStreams, Date.now())
      : null;

  let profileData: GetWalletAuthAndDataProfileData = {
    walletBalance,
    username: null,
    referralCode: null,
    userId: session.user.id,
    userUuid,
  };
  if (profileResult.success && profileResult.profile) {
    profileData = {
      walletBalance:
        walletBalance ?? profileResult.profile.walletBalance ?? null,
      username: profileResult.profile.username ?? null,
      referralCode: profileResult.profile.referralCode ?? null,
      userId: session.user.id,
      userUuid,
    };
  }

  const transactionsData =
    transactionsResult.success && transactionsResult.transactions
      ? transactionsResult.transactions
      : [];

  return {
    authenticated: true,
    profileData,
    transactions: transactionsData,
    streams: userStreams.length > 0 ? userStreams : null,
    email: session.user?.email ?? null,
  };
}

// ============================================================================
// Transaction History
// ============================================================================

export async function getTransactions(limit: number = 50) {
  try {
    const userUuid = await getUserUuidFromSession();

    const readDb = getDbReadOnly();
    // Get all transactions where user is sender OR recipient
    const transactionRows = await readDb
      .select()
      .from(transactions)
      .where(
        or(
          eq(transactions.userId, userUuid),
          eq(transactions.recipientUserId, userUuid),
        ),
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit);

    return {
      success: true,
      transactions: transactionRows.map((t) => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount || "0"),
        walletAddress: t.walletAddress || undefined,
        selectedChain: t.selectedChain || undefined,
        recipientUserId: t.recipientUserId || undefined,
        transactionId: t.transactionId || undefined,
        streamType: t.streamType || undefined,
        streamId: t.streamId ?? undefined,
        createdAt: t.createdAt.getTime(),
        isReceived:
          t.recipientUserId === userUuid ||
          t.type === "STREAM_CREATED" ||
          t.type === "STREAM_UPDATED",
      })),
    };
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not fetch transactions",
      transactions: [],
    };
  }
}

// ============================================================================
// Token Withdrawal
// ============================================================================

export async function withdrawTokens(
  walletAddress: string,
  selectedChain: string,
  amount: string,
) {
  try {
    const userUuid = await getUserUuidFromSession();

    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(walletAddress)) {
      return { success: false, error: "Invalid wallet address" };
    }

    const allowedChains = ["1", "56", "143", "480", "8453"];
    if (!allowedChains.includes(selectedChain)) {
      return { success: false, error: "Invalid chain" };
    }

    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    const flooredAmount = Math.floor(amountNumber * 1e18) / 1e18;
    if (flooredAmount < 10) {
      return { success: false, error: "Minimum 10 WDD" };
    }

    const nowMs = Date.now();

    // Debit streams inside a DB transaction with row-level locking
    const result = await db.transaction(async (tx) => {
      // SELECT ... FOR UPDATE to prevent concurrent withdrawal races
      const userStreams = await tx.execute(
        sql`SELECT * FROM streams WHERE user_id = ${userUuid} FOR UPDATE`,
      );

      const streamRows = (
        "rows" in userStreams ? userStreams.rows : userStreams
      ) as Array<{
        id: string;
        type: string;
        total_amount: string;
        initial_amount: string;
        withdrawn_amount: string;
        rate_per_second: string;
        started_at: string | Date;
        ends_at: string | Date;
        party_id: string;
        election_id: string;
      }>;

      const streamDataList: (StreamData & { dbId: string })[] = streamRows.map(
        (r) => ({
          dbId: r.id,
          id: r.id,
          type: r.type as "SUBSIDY" | "AMBASSADOR",
          totalAmount: Number.parseFloat(r.total_amount),
          initialAmount: Number.parseFloat(r.initial_amount),
          withdrawnAmount: Number.parseFloat(r.withdrawn_amount),
          ratePerSecond: Number.parseFloat(r.rate_per_second),
          startedAt: new Date(r.started_at).getTime(),
          endsAt: new Date(r.ends_at).getTime(),
          partyId: r.party_id,
          electionId: r.election_id,
        }),
      );

      const balance = computeWalletBalance(streamDataList, nowMs);
      if (balance < flooredAmount) {
        throw new Error(
          `Tried ${flooredAmount} but only have ${balance.toFixed(6)} WDD.`,
        );
      }

      // Debit oldest streams first
      let remaining = flooredAmount;
      const sortedStreams = [...streamDataList].sort(
        (a, b) => a.startedAt - b.startedAt,
      );
      const debits: {
        streamId: string;
        oldWithdrawn: number;
        newWithdrawn: number;
      }[] = [];

      for (const s of sortedStreams) {
        if (remaining <= 0) break;
        const accrued = computeStreamAccrued(s, nowMs);
        const available = Math.max(0, accrued - s.withdrawnAmount);
        if (available <= 0) continue;

        const debit = Math.min(available, remaining);
        debits.push({
          streamId: s.dbId,
          oldWithdrawn: s.withdrawnAmount,
          newWithdrawn: s.withdrawnAmount + debit,
        });
        remaining -= debit;
      }

      for (const d of debits) {
        await tx
          .update(streams)
          .set({ withdrawnAmount: d.newWithdrawn.toFixed(18) })
          .where(eq(streams.id, d.streamId));
      }

      const newBalance = balance - flooredAmount;
      await tx
        .update(userProfiles)
        .set({
          walletBalance: Math.max(0, newBalance).toFixed(18),
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userUuid));

      return { debits, oldBalance: balance };
    });

    let fromAddress: string;
    if (selectedChain === "480") {
      fromAddress = "0x7aCA7AFDa78884fE0a58fb8B3988B9f93F963950";
    } else {
      fromAddress = "0x55F6020eCA3B523A027596c9a542110302FEC0ac";
    }

    const amountWei = BigInt(Math.floor(flooredAmount * 1e18)).toString();

    const response = await fetch(
      "https://engine.thirdweb.com/v1/write/contract",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-secret-key": process.env.THIRDWEB_SECRET_KEY!,
        },
        body: JSON.stringify({
          executionOptions: {
            from: fromAddress,
            chainId: selectedChain,
          },
          params: [
            {
              contractAddress: "0xEdE54d9c024ee80C85ec0a75eD2d8774c7Fbac9B",
              method: "function transfer(address to, uint256 amount)",
              params: [walletAddress, amountWei],
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      // Revert stream debits to original values
      await db.transaction(async (tx) => {
        for (const d of result.debits) {
          await tx
            .update(streams)
            .set({ withdrawnAmount: d.oldWithdrawn.toFixed(18) })
            .where(eq(streams.id, d.streamId));
        }
        await tx
          .update(userProfiles)
          .set({
            walletBalance: result.oldBalance.toFixed(18),
            updatedAt: new Date(),
          })
          .where(eq(userProfiles.id, userUuid));
      });

      const errorData = await response.json().catch(() => ({}));
      console.error("Thirdweb API error:", errorData);
      return {
        success: false,
        error: `Transaction failed to queue: ${response.status}`,
      };
    }

    const data = await response.json();
    const transactionId = data.result?.transactions?.[0]?.id;

    if (transactionId) {
      await db.insert(transactions).values({
        userId: userUuid,
        type: "WITHDRAWAL",
        amount: flooredAmount.toFixed(18),
        walletAddress,
        selectedChain,
        transactionId,
      });

      revalidatePath("/[lang]/wallet", "page");

      return {
        success: true,
        transactionId,
      };
    }
    return { success: false, error: "Transaction ID not found" };
  } catch (error) {
    console.error("Error withdrawing tokens:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not withdraw tokens",
    };
  }
}

// ============================================================================
// Username Management
// ============================================================================

/**
 * Set or update username for the current user
 * @param username - The username to set (3-30 chars, alphanumeric + underscore/hyphen)
 * @returns Success status and error message if failed
 */
export async function setUsername(username: string) {
  // Get UUID from session
  const userUuid = await getUserUuidFromSession();

  try {
    // Validate username format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Check if user profile exists
    const [userProfile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(eq(userProfiles.id, userUuid))
      .limit(1);

    if (!userProfile) {
      return {
        success: false,
        error: "User profile not found.",
      };
    }

    // Check if username is already taken by another user (case-insensitive)
    const [existingProfile] = await db
      .select({ id: userProfiles.id })
      .from(userProfiles)
      .where(
        and(
          sql`LOWER(${userProfiles.username}) = ${trimmedUsername}`,
          sql`${userProfiles.id} != ${userUuid}`,
        ),
      )
      .limit(1);

    if (existingProfile) {
      return { success: false, error: "Username is already taken" };
    }

    // Update username in userProfiles and all parties where user is founder
    await db.transaction(async (tx) => {
      // Update username in user profile
      await tx
        .update(userProfiles)
        .set({
          username: trimmedUsername,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userUuid));

      // Update leaderUsername in the party where user is founder
      await tx
        .update(parties)
        .set({
          leaderUsername: trimmedUsername,
          updatedAt: new Date(),
        })
        .where(eq(parties.foundedBy, userUuid));
    });

    // Revalidate paths and cache tags that show user profile and parties
    revalidatePath("/[lang]/menu/account", "page");
    revalidatePath("/[lang]/parties", "page");
    revalidateTag("parties-list", "default");

    return { success: true };
  } catch (error) {
    console.error("Error setting username:", error);
    // Check for unique constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return { success: false, error: "Username is already taken" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not set username",
    };
  }
}
