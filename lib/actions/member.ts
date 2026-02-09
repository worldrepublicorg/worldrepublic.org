"use server";

import { and, desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db, getDbReadOnly } from "@/lib/db/connection";
import { parties, transactions, userProfiles, users } from "@/lib/db/schema";
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
 * Creates a user profile for a newly registered user
 * Always generates a random username (e.g., citizen_abc12345) regardless of sign-in method
 * (Gmail, passkey, etc.). This ensures privacy and consistency across all authentication methods.
 * @param userUuid - UUID of the user from the users table
 * @param authUserId - Auth user ID (numeric ID from users table)
 * @returns The created profile or null if creation failed
 */
export async function createUserProfile(
  userUuid: string,
  authUserId: number,
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

  // Always generate a random username (never derived from email or other user data)
  // This applies to all sign-in methods: Gmail, passkey, etc.
  // Try to generate a unique username with a bounded number of attempts
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

  // Create the profile row
  await db.insert(userProfiles).values({
    id: userUuid,
    authUserId,
    username,
    walletBalance: "0",
  });

  // Re-fetch the newly created profile using the read replica
  const [profile] = await dbReadOnly
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userUuid))
    .limit(1);

  return profile || null;
}

export async function getUserProfile() {
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

      // Create the profile
      const newProfile = await createUserProfile(userUuid, authUserId);

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
  createdAt: number;
  isReceived: boolean;
};

export type GetWalletAuthAndDataResult = {
  authenticated: boolean;
  profileData: GetWalletAuthAndDataProfileData | null;
  transactions: GetWalletAuthAndDataTransaction[] | null;
  email: string | null;
};

export async function getWalletAuthAndData(): Promise<GetWalletAuthAndDataResult> {
  const session = await auth();
  const isAuthenticated = !!session?.user;

  if (!isAuthenticated || !session?.user?.id) {
    return {
      authenticated: false,
      profileData: null,
      transactions: null,
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
    getUserProfile(),
    getTransactions(100),
  ]);

  const userUuid = userResult?.uuid ?? null;
  if (!userUuid) {
    return {
      authenticated: true,
      profileData: null,
      transactions: null,
      email: session.user?.email ?? null,
    };
  }

  let profileData: GetWalletAuthAndDataProfileData = {
    walletBalance: null,
    username: null,
    userId: session.user.id,
    userUuid,
  };
  if (profileResult.success && profileResult.profile) {
    profileData = {
      walletBalance: profileResult.profile.walletBalance ?? null,
      username: profileResult.profile.username ?? null,
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
        // For WITHDRAWAL
        walletAddress: t.walletAddress || undefined,
        selectedChain: t.selectedChain || undefined,
        // For TRANSFER
        recipientUserId: t.recipientUserId || undefined,
        // Common
        transactionId: t.transactionId || undefined,
        createdAt: t.createdAt.getTime(),
        // Helper: is this a received transfer?
        isReceived: t.recipientUserId === userUuid,
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
    // Get user UUID from session
    const userUuid = await getUserUuidFromSession();

    // Server-side validation for wallet address
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(walletAddress)) {
      return { success: false, error: "Invalid wallet address" };
    }

    // Server-side validation for selected chain
    const allowedChains = ["56", "143", "480", "8453"];
    if (!allowedChains.includes(selectedChain)) {
      return { success: false, error: "Invalid chain" };
    }

    // Server-side validation for amount
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return { success: false, error: "Invalid amount" };
    }

    // Floor to 18 dp to avoid rounding up beyond true balance
    const flooredAmount = Math.floor(amountNumber * 1e18) / 1e18;

    // Check minimum withdrawal amount
    if (flooredAmount < 10) {
      return { success: false, error: "Minimum 10 WDD" };
    }

    // Use PostgreSQL transaction for atomic withdrawal
    const result = await db.transaction(async (tx) => {
      // Get current profile - transaction isolation provides atomicity
      const [profile] = await tx
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, userUuid))
        .limit(1);

      if (!profile) {
        throw new Error("User not found");
      }

      // Parse current balance
      const walletBalance = parseFloat(profile.walletBalance || "0");

      // Check sufficient balance
      if (walletBalance < flooredAmount) {
        throw new Error(
          `Tried ${flooredAmount} but only have ${walletBalance} WDD.`,
        );
      }

      // Calculate new balance
      const newWalletBalance = walletBalance - flooredAmount;

      // Update balance atomically
      await tx
        .update(userProfiles)
        .set({
          walletBalance: newWalletBalance.toFixed(18),
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userUuid));

      // Return original value for potential revert
      return {
        oldWalletBalance: walletBalance,
      };
    });

    // Transaction succeeded, proceed with blockchain transaction
    // Determine the from address based on the selected chain
    let fromAddress: string;
    if (selectedChain === "480") {
      fromAddress = "0x7aCA7AFDa78884fE0a58fb8B3988B9f93F963950";
    } else {
      // For chains 56 (BSC), 143 (Monad), and 8453 (Base), use the original address
      fromAddress = "0x55F6020eCA3B523A027596c9a542110302FEC0ac";
    }

    // Convert flooredAmount (18 decimals) to wei as string
    // Since we store 18 decimals, we can directly multiply by 10^18
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

    // If blockchain transaction fails, we need to revert the database
    if (!response.ok) {
      // Revert balance using another transaction
      await db.transaction(async (tx) => {
        await tx
          .update(userProfiles)
          .set({
            walletBalance: result.oldWalletBalance.toFixed(18),
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

    // Monitor transaction and handle failures
    const data = await response.json();
    const transactionId = data.result?.transactions?.[0]?.id;

    if (transactionId) {
      // Store withdrawal record in PostgreSQL
      await db.insert(transactions).values({
        userId: userUuid,
        type: "WITHDRAWAL",
        amount: flooredAmount.toFixed(18),
        walletAddress,
        selectedChain,
        transactionId,
      });

      // Revalidate paths that show wallet data
      revalidatePath("/[lang]/wallet", "page");

      return {
        success: true,
        transactionId,
      };
    } else {
      return { success: false, error: "Transaction ID not found" };
    }
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
