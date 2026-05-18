"use server";

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { db, getDbReadOnly } from "@/lib/db/connection";
import {
	accounts,
	parties,
	referrals,
	streams,
	transactions,
	userProfiles,
	userSelfVerifications,
	users,
} from "@/lib/db/schema";
import {
	computeStreamAccrued,
	computeWalletBalance,
	type StreamData,
} from "@/lib/streams";
import { validateUsername } from "@/lib/utils";
import { getMinWithdrawalAmount } from "@/lib/withdrawal-limits";

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
		code +=
			REFERRAL_CHARSET[Math.floor(Math.random() * REFERRAL_CHARSET.length)];
	}
	return code;
}

// Helper function to get user UUID from session
async function getUserUuidFromSession(): Promise<string> {
	const { auth } = await import("@/lib/auth");
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	const authUserId = parseInt(String(session.user.id), 10);

	// Get UUID from users table
	const [user] = await db
		.select({ uuid: users.uuid })
		.from(users)
		.where(eq(users.id, authUserId))
		.limit(1);

	if (!user?.uuid) {
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

async function getLinkedProviders(authUserId: number) {
	const rows = await db
		.select({
			provider: accounts.provider,
			providerAccountId: accounts.providerAccountId,
		})
		.from(accounts)
		.where(eq(accounts.userId, authUserId));

	return {
		hasGoogle: rows.some((row) => row.provider === "google"),
		googleEmail:
			rows.find((row) => row.provider === "google")?.providerAccountId ?? null,
		passkeyCount: rows.filter((row) => row.provider === "passkey").length,
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
			// Unlink Self verification so the same person can verify a new account later.
			await tx
				.delete(userSelfVerifications)
				.where(eq(userSelfVerifications.userId, userUuid));

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
	storedWalletBalance: number;
	savingsBalance: number;
	unclaimedSavingsInterest: number;
	savingsLastUpdatedAt: number | null;
	basicIncomeAndInterestClaimedTotal: number;
	selfVerifiedAt: number | null;
	username: string | null;
	referralCode: string | null;
	referredByUsername: string | null;
	userId: string;
	userUuid: string | null;
	basicIncomeActivatedAt: number | null;
	lastBasicIncomeClaimAt: number | null;
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
	streamRatesById?: Record<string, number> | null;
	linkedProviders: {
		hasGoogle: boolean;
		googleEmail: string | null;
		passkeyCount: number;
	} | null;
};

async function getUserStreamsByUuid(userUuid: string): Promise<StreamData[]> {
	const readDb = getDbReadOnly();
	const rows = await readDb
		.select()
		.from(streams)
		.where(
			and(
				eq(streams.userId, userUuid),
				// Only include leaf streams; superseded rows are historical snapshots.
				sql`NOT EXISTS (
          SELECT 1
          FROM streams child
          WHERE child.source_stream_id = ${streams.id}
        )`,
			),
		)
		.orderBy(asc(streams.startedAt));

	return rows.map((r) => ({
		id: r.id,
		type: r.type as "SUBSIDY" | "AMBASSADOR" | "BASIC_INCOME",
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
			streamRatesById: null,
			linkedProviders: null,
		};
	}

	const authUserId = parseInt(String(session.user.id), 10);

	const [userResult, profileResult, transactionsResult, linkedProviders] =
		await Promise.all([
			db
				.select({ uuid: users.uuid })
				.from(users)
				.where(eq(users.id, authUserId))
				.limit(1)
				.then(([user]) => user || null),
			getUserProfile(pendingReferralCode),
			getTransactions(100),
			getLinkedProviders(authUserId),
		]);

	const userUuid = userResult?.uuid ?? null;
	if (!userUuid) {
		return {
			authenticated: true,
			profileData: null,
			transactions: null,
			streams: null,
			streamRatesById: null,
			linkedProviders,
		};
	}

	const userStreams = await getUserStreamsByUuid(userUuid);

	// Fetch BI-related fields directly from user_profiles
	const readDb = getDbReadOnly();
	const [referralRow] = await readDb
		.select({ referrerId: referrals.referrerId })
		.from(referrals)
		.where(eq(referrals.referredId, userUuid))
		.limit(1);

	let referredByUsername: string | null = null;
	if (referralRow?.referrerId) {
		const [referrerProfileRow] = await readDb
			.select({ username: userProfiles.username })
			.from(userProfiles)
			.where(eq(userProfiles.id, referralRow.referrerId))
			.limit(1);
		referredByUsername = referrerProfileRow?.username ?? null;
	}

	const [profileRow] = await readDb
		.select({
			walletBalance: userProfiles.walletBalance,
			savingsBalance: userProfiles.savingsBalance,
			unclaimedSavingsInterest: userProfiles.unclaimedSavingsInterest,
			savingsLastUpdatedAt: userProfiles.savingsLastUpdatedAt,
			basicIncomeAndInterestClaimedTotal:
				userProfiles.basicIncomeAndInterestClaimedTotal,
			basicIncomeActivatedAt: userProfiles.basicIncomeActivatedAt,
			lastBasicIncomeClaimAt: userProfiles.lastBasicIncomeClaimAt,
		})
		.from(userProfiles)
		.where(eq(userProfiles.id, userUuid))
		.limit(1);

	const [selfVerificationRow] = await readDb
		.select({
			selfVerifiedAt: userSelfVerifications.selfVerifiedAt,
		})
		.from(userSelfVerifications)
		.where(eq(userSelfVerifications.userId, userUuid))
		.limit(1);

	const storedWalletBalance = profileRow?.walletBalance
		? parseFloat(profileRow.walletBalance)
		: 0;

	// Total balance = stream balance (excluding BI) + walletBalance (which holds claimed BI)
	const streamBalance =
		userStreams.length > 0 ? computeWalletBalance(userStreams, Date.now()) : 0;
	const walletBalance = streamBalance + storedWalletBalance;

	let profileData: GetWalletAuthAndDataProfileData = {
		walletBalance: walletBalance || null,
		storedWalletBalance,
		savingsBalance: profileRow?.savingsBalance
			? parseFloat(profileRow.savingsBalance)
			: 0,
		unclaimedSavingsInterest: profileRow?.unclaimedSavingsInterest
			? parseFloat(profileRow.unclaimedSavingsInterest)
			: 0,
		savingsLastUpdatedAt: profileRow?.savingsLastUpdatedAt?.getTime() ?? null,
		basicIncomeAndInterestClaimedTotal:
			profileRow?.basicIncomeAndInterestClaimedTotal
				? parseFloat(profileRow.basicIncomeAndInterestClaimedTotal)
				: 0,
		selfVerifiedAt: selfVerificationRow?.selfVerifiedAt?.getTime() ?? null,
		username: null,
		referralCode: null,
		referredByUsername,
		userId: session.user.id,
		userUuid,
		basicIncomeActivatedAt:
			profileRow?.basicIncomeActivatedAt?.getTime() ?? null,
		lastBasicIncomeClaimAt:
			profileRow?.lastBasicIncomeClaimAt?.getTime() ?? null,
	};
	if (profileResult.success && profileResult.profile) {
		profileData = {
			...profileData,
			username: profileResult.profile.username ?? null,
			referralCode: profileResult.profile.referralCode ?? null,
			referredByUsername,
		};
	}

	const transactionsData =
		transactionsResult.success && transactionsResult.transactions
			? transactionsResult.transactions
			: [];
	const streamIds = Array.from(
		new Set(
			transactionsData
				.map((t) => t.streamId)
				.filter((id): id is string => !!id),
		),
	);
	let streamRatesById: Record<string, number> | null = null;
	if (streamIds.length > 0) {
		const streamRateRows = await readDb
			.select({
				id: streams.id,
				ratePerSecond: streams.ratePerSecond,
			})
			.from(streams)
			.where(inArray(streams.id, streamIds));

		streamRatesById = Object.fromEntries(
			streamRateRows.map((row) => [
				row.id,
				Number.parseFloat(row.ratePerSecond),
			]),
		);
	}

	return {
		authenticated: true,
		profileData,
		transactions: transactionsData,
		streams: userStreams.length > 0 ? userStreams : null,
		streamRatesById,
		linkedProviders,
	};
}

// ============================================================================
// Transaction History
// ============================================================================

export async function getTransactions(limit: number = 50, offset: number = 0) {
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
			.offset(offset)
			.limit(limit);

		return {
			success: true,
			hasMore: transactionRows.length === limit,
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
					t.type === "REFERRAL_VERIFIED_BONUS" ||
					t.type === "ADMIN_STREAM_REPAIR" ||
					t.type === "STREAM_CREATED" ||
					t.type === "STREAM_UPDATED",
			})),
		};
	} catch (error) {
		console.error("Error fetching transactions:", error);
		return {
			success: false,
			hasMore: false,
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

		const allowedChains = ["480", "8453"];
		if (!allowedChains.includes(selectedChain)) {
			return { success: false, error: "Invalid chain" };
		}

		const amountNumber = parseFloat(amount);
		if (Number.isNaN(amountNumber) || amountNumber <= 0) {
			return { success: false, error: "Invalid amount" };
		}

		const minAmount = getMinWithdrawalAmount(selectedChain);
		const flooredAmount = Math.floor(amountNumber * 1e18) / 1e18;
		if (flooredAmount < minAmount) {
			return { success: false, error: `Minimum ${minAmount} WDD` };
		}

		const nowMs = Date.now();

		// Debit streams inside a DB transaction with row-level locking
		const result = await db.transaction(async (tx) => {
			// SELECT ... FOR UPDATE to prevent concurrent withdrawal races
			const userStreams = await tx.execute(
				sql`SELECT *
            FROM streams s
            WHERE s.user_id = ${userUuid}
              AND NOT EXISTS (
                SELECT 1
                FROM streams child
                WHERE child.source_stream_id = s.id
              )
            FOR UPDATE`,
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
					type: r.type as "SUBSIDY" | "AMBASSADOR" | "BASIC_INCOME",
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

			// Lock the user profile row too (for walletBalance debit)
			const profileRows = await tx.execute(
				sql`SELECT wallet_balance, savings_balance, basic_income_and_interest_claimed_total
            FROM user_profiles WHERE id = ${userUuid} FOR UPDATE`,
			);
			const selfVerificationRows = await tx.execute(
				sql`SELECT self_verified_at FROM user_self_verifications WHERE user_id = ${userUuid} LIMIT 1`,
			);
			const profileRow = (
				"rows" in profileRows ? profileRows.rows : profileRows
			) as Array<{
				wallet_balance: string;
				savings_balance: string;
				basic_income_and_interest_claimed_total: string;
			}>;
			const verificationRow = (
				"rows" in selfVerificationRows
					? selfVerificationRows.rows
					: selfVerificationRows
			) as Array<{ self_verified_at: string | Date | null }>;
			const storedWalletBalance = parseFloat(
				profileRow[0]?.wallet_balance ?? "0",
			);
			const savingsBalance = parseFloat(profileRow[0]?.savings_balance ?? "0");
			const restrictedClaimedTotal = parseFloat(
				profileRow[0]?.basic_income_and_interest_claimed_total ?? "0",
			);
			const isSelfVerified = Boolean(verificationRow[0]?.self_verified_at);

			// computeWalletBalance already excludes BASIC_INCOME streams
			const streamBalance = computeWalletBalance(streamDataList, nowMs);
			const totalBalance = streamBalance + storedWalletBalance;

			if (totalBalance < flooredAmount) {
				throw new Error(
					`Tried ${flooredAmount} but only have ${totalBalance.toFixed(6)} WDD.`,
				);
			}

			// For unverified users, keep claimed BI + claimed savings-interest
			// protected while still allowing stream-derived funds in wallet to move.
			// The protected floor in wallet is the portion that cannot be covered
			// by savings balance.
			let remaining = flooredAmount;
			const protectedWalletFloor = isSelfVerified
				? 0
				: Math.max(0, restrictedClaimedTotal - savingsBalance);
			const maxWalletSpendable = Math.max(
				0,
				storedWalletBalance - protectedWalletFloor,
			);
			const walletDebit = Math.min(maxWalletSpendable, remaining);
			remaining -= walletDebit;

			const sortedStreams = [...streamDataList]
				.filter((s) => s.type !== "BASIC_INCOME")
				.sort((a, b) => a.startedAt - b.startedAt);
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

			if (remaining > 1e-9) {
				throw new Error(
					`Tried ${flooredAmount} but only have ${(flooredAmount - remaining).toFixed(6)} WDD available right now.`,
				);
			}

			for (const d of debits) {
				await tx
					.update(streams)
					.set({ withdrawnAmount: d.newWithdrawn.toFixed(18) })
					.where(eq(streams.id, d.streamId));
			}

			const newWalletBalance = Math.max(0, storedWalletBalance - walletDebit);
			await tx
				.update(userProfiles)
				.set({
					walletBalance: newWalletBalance.toFixed(18),
					updatedAt: new Date(),
				})
				.where(eq(userProfiles.id, userUuid));

			return {
				debits,
				oldBalance: totalBalance,
				oldWalletBalance: storedWalletBalance,
			};
		});

		let fromAddress: string;
		if (selectedChain === "480") {
			fromAddress = "0x7aCA7AFDa78884fE0a58fb8B3988B9f93F963950";
		} else if (selectedChain === "8453") {
			fromAddress = "0x55F6020eCA3B523A027596c9a542110302FEC0ac";
		} else {
			return { success: false, error: "Invalid chain" };
		}

		const amountWei = BigInt(Math.floor(flooredAmount * 1e18)).toString();
		const thirdwebSecretKey = process.env.THIRDWEB_SECRET_KEY;
		if (!thirdwebSecretKey) {
			return { success: false, error: "Missing THIRDWEB_SECRET_KEY" };
		}

		const response = await fetch(
			"https://engine.thirdweb.com/v1/write/contract",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-secret-key": thirdwebSecretKey,
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
			// Revert stream debits and walletBalance to original values
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

			revalidatePath("/[lang]/menu/wallet", "page");

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
// Basic Income
// ============================================================================

const BASIC_INCOME_RATE_PER_SECOND = 1 / 86400; // 1 WDD per day
const NON_WITHDRAWABLE_BALANCE_BUFFER = 0.01;
// Keep BI-related holdings strictly below minimum withdrawal amount.
// This cap is intended to cover the combined BI wallet + BI savings ceiling.
const BASIC_INCOME_BALANCE_CAP = Math.max(
	0,
	getMinWithdrawalAmount("8453") - NON_WITHDRAWABLE_BALANCE_BUFFER,
);
const SAVINGS_ANNUAL_INTEREST_RATE = 0.69;
const SAVINGS_DAILY_INTEREST_RATE = SAVINGS_ANNUAL_INTEREST_RATE / 365;

function calculateAccruedSavingsInterest(
	savingsBalance: number,
	savingsLastUpdatedAt: Date | null,
	nowMs: number,
): number {
	if (savingsBalance <= 0 || !savingsLastUpdatedAt) return 0;
	const elapsedDays = (nowMs - savingsLastUpdatedAt.getTime()) / 86_400_000;
	if (elapsedDays <= 0) return 0;
	return savingsBalance * SAVINGS_DAILY_INTEREST_RATE * elapsedDays;
}

export async function activateBasicIncome(): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const userUuid = await getUserUuidFromSession();

		const [profile] = await db
			.select({
				basicIncomeActivatedAt: userProfiles.basicIncomeActivatedAt,
			})
			.from(userProfiles)
			.where(eq(userProfiles.id, userUuid))
			.limit(1);

		if (!profile) {
			return { success: false, error: "Profile not found" };
		}

		if (profile.basicIncomeActivatedAt) {
			return { success: true };
		}

		const now = new Date();
		const endsAt = new Date(now.getTime() + 100 * 365.25 * 24 * 3600 * 1000);

		await db.transaction(async (tx) => {
			await tx
				.update(userProfiles)
				.set({
					basicIncomeActivatedAt: now,
					lastBasicIncomeClaimAt: now,
					updatedAt: now,
				})
				.where(eq(userProfiles.id, userUuid));

			await tx.insert(streams).values({
				userId: userUuid,
				type: "BASIC_INCOME",
				totalAmount: "999999999",
				initialAmount: "0",
				withdrawnAmount: "0",
				ratePerSecond: BASIC_INCOME_RATE_PER_SECOND.toFixed(18),
				startedAt: now,
				endsAt,
				electionId: null,
				partyId: null,
			});
		});

		revalidatePath("/[lang]", "page");

		return { success: true };
	} catch (error) {
		console.error("Error activating basic income:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Could not activate basic income",
		};
	}
}

export async function claimBasicIncome(): Promise<{
	success: boolean;
	claimedAmount?: number;
	error?: string;
}> {
	try {
		const userUuid = await getUserUuidFromSession();

		const result = await db.transaction(async (tx) => {
			const selfVerificationRows = await tx.execute(
				sql`SELECT self_verified_at FROM user_self_verifications WHERE user_id = ${userUuid} LIMIT 1`,
			);
			const profileRows = await tx.execute(
				sql`SELECT basic_income_activated_at, last_basic_income_claim_at, wallet_balance, basic_income_and_interest_claimed_total
            FROM user_profiles WHERE id = ${userUuid} FOR UPDATE`,
			);
			const verificationRow = (
				"rows" in selfVerificationRows
					? selfVerificationRows.rows
					: selfVerificationRows
			) as Array<{ self_verified_at: string | Date | null }>;
			const rows = (
				"rows" in profileRows ? profileRows.rows : profileRows
			) as Array<{
				basic_income_activated_at: string | Date | null;
				last_basic_income_claim_at: string | Date | null;
				wallet_balance: string;
				basic_income_and_interest_claimed_total: string;
			}>;

			const profile = rows[0];
			if (!profile?.basic_income_activated_at) {
				return { success: false as const, error: "Basic income not activated" };
			}

			const activatedAt = new Date(profile.basic_income_activated_at).getTime();
			const lastClaimAt = profile.last_basic_income_claim_at
				? new Date(profile.last_basic_income_claim_at).getTime()
				: activatedAt;
			const currentBalance = parseFloat(profile.wallet_balance || "0");
			const basicIncomeAndInterestClaimedTotal = parseFloat(
				profile.basic_income_and_interest_claimed_total || "0",
			);
			const isSelfVerified = Boolean(verificationRow[0]?.self_verified_at);

			const now = Date.now();
			const elapsedDays = (now - lastClaimAt) / 86_400_000;
			const claimable = Math.min(elapsedDays, 1);
			const maxCanClaim = isSelfVerified
				? claimable
				: Math.max(
						0,
						BASIC_INCOME_BALANCE_CAP - basicIncomeAndInterestClaimedTotal,
					);
			const finalClaimable = Math.min(claimable, maxCanClaim);

			if (finalClaimable <= 1e-12) {
				if (maxCanClaim <= 0) {
					return { success: false as const, error: "Balance cap reached" };
				}
				return { success: false as const, error: "Nothing to claim yet" };
			}

			const newBalance = currentBalance + finalClaimable;
			const newBasicIncomeAndInterestClaimedTotal =
				basicIncomeAndInterestClaimedTotal + finalClaimable;
			await tx
				.update(userProfiles)
				.set({
					walletBalance: newBalance.toFixed(18),
					basicIncomeAndInterestClaimedTotal:
						newBasicIncomeAndInterestClaimedTotal.toFixed(18),
					lastBasicIncomeClaimAt: new Date(now),
					updatedAt: new Date(now),
				})
				.where(eq(userProfiles.id, userUuid));

			await tx.insert(transactions).values({
				userId: userUuid,
				type: "BASIC_INCOME_CLAIM",
				amount: finalClaimable.toFixed(18),
				streamType: "BASIC_INCOME",
			});

			return { success: true as const, claimedAmount: finalClaimable };
		});

		if (result.success) {
			revalidatePath("/[lang]", "page");
			revalidatePath("/[lang]/menu/wallet", "page");
		}

		return result;
	} catch (error) {
		console.error("Error claiming basic income:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Could not claim basic income",
		};
	}
}

// ============================================================================
// Savings (Offchain)
// ============================================================================

export async function depositToSavings(amount: number): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const userUuid = await getUserUuidFromSession();
		const flooredAmount = Math.floor(amount * 1e18) / 1e18;
		if (!Number.isFinite(flooredAmount) || flooredAmount <= 0) {
			return { success: false, error: "Deposit amount must be positive" };
		}

		await db.transaction(async (tx) => {
			const profileRows = await tx.execute(
				sql`SELECT wallet_balance, savings_balance, unclaimed_savings_interest, savings_last_updated_at
            FROM user_profiles WHERE id = ${userUuid} FOR UPDATE`,
			);
			const userStreams = await tx.execute(
				sql`SELECT *
            FROM streams s
            WHERE s.user_id = ${userUuid}
              AND NOT EXISTS (
                SELECT 1
                FROM streams child
                WHERE child.source_stream_id = s.id
              )
            FOR UPDATE`,
			);
			const rows = (
				"rows" in profileRows ? profileRows.rows : profileRows
			) as Array<{
				wallet_balance: string;
				savings_balance: string;
				unclaimed_savings_interest: string;
				savings_last_updated_at: string | Date | null;
			}>;
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

			const profile = rows[0];
			if (!profile) {
				throw new Error("Profile not found");
			}

			const currentWalletBalance = parseFloat(profile.wallet_balance || "0");
			const currentSavingsBalance = parseFloat(profile.savings_balance || "0");
			const currentUnclaimedInterest = parseFloat(
				profile.unclaimed_savings_interest || "0",
			);
			const currentLastUpdatedAt = profile.savings_last_updated_at
				? new Date(profile.savings_last_updated_at)
				: null;

			const nowMs = Date.now();
			const streamDataList: (StreamData & { dbId: string })[] = streamRows.map(
				(r) => ({
					dbId: r.id,
					id: r.id,
					type: r.type as "SUBSIDY" | "AMBASSADOR" | "BASIC_INCOME",
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
			const streamBalance = computeWalletBalance(streamDataList, nowMs);
			const totalBalance = currentWalletBalance + streamBalance;

			if (totalBalance < flooredAmount) {
				throw new Error(
					`Tried ${flooredAmount} but only have ${totalBalance.toFixed(6)} WDD.`,
				);
			}

			let remaining = flooredAmount;
			const walletDebit = Math.min(currentWalletBalance, remaining);
			remaining -= walletDebit;

			const sortedStreams = [...streamDataList]
				.filter((s) => s.type !== "BASIC_INCOME")
				.sort((a, b) => a.startedAt - b.startedAt);
			const debits: {
				streamId: string;
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
					newWithdrawn: s.withdrawnAmount + debit,
				});
				remaining -= debit;
			}

			if (remaining > 1e-9) {
				throw new Error(
					`Tried ${flooredAmount} but only have ${(flooredAmount - remaining).toFixed(6)} WDD available right now.`,
				);
			}

			for (const d of debits) {
				await tx
					.update(streams)
					.set({ withdrawnAmount: d.newWithdrawn.toFixed(18) })
					.where(eq(streams.id, d.streamId));
			}

			const now = new Date();
			const nowMsForInterest = now.getTime();
			const newlyAccruedInterest = calculateAccruedSavingsInterest(
				currentSavingsBalance,
				currentLastUpdatedAt,
				nowMsForInterest,
			);

			await tx
				.update(userProfiles)
				.set({
					walletBalance: (currentWalletBalance - walletDebit).toFixed(18),
					savingsBalance: (currentSavingsBalance + flooredAmount).toFixed(18),
					unclaimedSavingsInterest: (
						currentUnclaimedInterest + newlyAccruedInterest
					).toFixed(18),
					savingsLastUpdatedAt: now,
					updatedAt: now,
				})
				.where(eq(userProfiles.id, userUuid));

			await tx.insert(transactions).values({
				userId: userUuid,
				type: "SAVINGS_DEPOSIT",
				amount: flooredAmount.toFixed(18),
			});
		});

		revalidatePath("/[lang]", "page");
		revalidatePath("/[lang]/menu/wallet", "page");
		return { success: true };
	} catch (error) {
		console.error("Error depositing to savings:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Could not deposit to savings",
		};
	}
}

export async function withdrawFromSavings(amount: number): Promise<{
	success: boolean;
	error?: string;
}> {
	try {
		const userUuid = await getUserUuidFromSession();
		const flooredAmount = Math.floor(amount * 1e18) / 1e18;
		if (!Number.isFinite(flooredAmount) || flooredAmount <= 0) {
			return { success: false, error: "Withdrawal amount must be positive" };
		}

		await db.transaction(async (tx) => {
			const profileRows = await tx.execute(
				sql`SELECT wallet_balance, savings_balance, unclaimed_savings_interest, savings_last_updated_at
            FROM user_profiles WHERE id = ${userUuid} FOR UPDATE`,
			);
			const rows = (
				"rows" in profileRows ? profileRows.rows : profileRows
			) as Array<{
				wallet_balance: string;
				savings_balance: string;
				unclaimed_savings_interest: string;
				savings_last_updated_at: string | Date | null;
			}>;

			const profile = rows[0];
			if (!profile) {
				throw new Error("Profile not found");
			}

			const currentWalletBalance = parseFloat(profile.wallet_balance || "0");
			const currentSavingsBalance = parseFloat(profile.savings_balance || "0");
			const currentUnclaimedInterest = parseFloat(
				profile.unclaimed_savings_interest || "0",
			);
			const currentLastUpdatedAt = profile.savings_last_updated_at
				? new Date(profile.savings_last_updated_at)
				: null;

			if (currentSavingsBalance < flooredAmount) {
				throw new Error(
					`Tried ${flooredAmount} but only have ${currentSavingsBalance.toFixed(6)} WDD in savings.`,
				);
			}

			const now = new Date();
			const nowMs = now.getTime();
			const newlyAccruedInterest = calculateAccruedSavingsInterest(
				currentSavingsBalance,
				currentLastUpdatedAt,
				nowMs,
			);

			await tx
				.update(userProfiles)
				.set({
					walletBalance: (currentWalletBalance + flooredAmount).toFixed(18),
					savingsBalance: (currentSavingsBalance - flooredAmount).toFixed(18),
					unclaimedSavingsInterest: (
						currentUnclaimedInterest + newlyAccruedInterest
					).toFixed(18),
					savingsLastUpdatedAt: now,
					updatedAt: now,
				})
				.where(eq(userProfiles.id, userUuid));

			await tx.insert(transactions).values({
				userId: userUuid,
				type: "SAVINGS_WITHDRAWAL",
				amount: flooredAmount.toFixed(18),
			});
		});

		revalidatePath("/[lang]", "page");
		revalidatePath("/[lang]/menu/wallet", "page");
		return { success: true };
	} catch (error) {
		console.error("Error withdrawing from savings:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Could not withdraw from savings",
		};
	}
}

export async function claimSavingsInterest(): Promise<{
	success: boolean;
	claimedAmount?: number;
	error?: string;
}> {
	try {
		const userUuid = await getUserUuidFromSession();

		const result = await db.transaction(async (tx) => {
			const selfVerificationRows = await tx.execute(
				sql`SELECT self_verified_at FROM user_self_verifications WHERE user_id = ${userUuid} LIMIT 1`,
			);
			const profileRows = await tx.execute(
				sql`SELECT wallet_balance, savings_balance, unclaimed_savings_interest, savings_last_updated_at, basic_income_and_interest_claimed_total
            FROM user_profiles WHERE id = ${userUuid} FOR UPDATE`,
			);
			const verificationRow = (
				"rows" in selfVerificationRows
					? selfVerificationRows.rows
					: selfVerificationRows
			) as Array<{ self_verified_at: string | Date | null }>;
			const rows = (
				"rows" in profileRows ? profileRows.rows : profileRows
			) as Array<{
				wallet_balance: string;
				savings_balance: string;
				unclaimed_savings_interest: string;
				savings_last_updated_at: string | Date | null;
				basic_income_and_interest_claimed_total: string;
			}>;

			const profile = rows[0];
			if (!profile) {
				return { success: false as const, error: "Profile not found" };
			}

			const currentWalletBalance = parseFloat(profile.wallet_balance || "0");
			const currentSavingsBalance = parseFloat(profile.savings_balance || "0");
			const currentUnclaimedInterest = parseFloat(
				profile.unclaimed_savings_interest || "0",
			);
			const currentLastUpdatedAt = profile.savings_last_updated_at
				? new Date(profile.savings_last_updated_at)
				: null;
			const basicIncomeAndInterestClaimedTotal = parseFloat(
				profile.basic_income_and_interest_claimed_total || "0",
			);
			const isSelfVerified = Boolean(verificationRow[0]?.self_verified_at);

			const now = new Date();
			const nowMs = now.getTime();
			const newlyAccruedInterest = calculateAccruedSavingsInterest(
				currentSavingsBalance,
				currentLastUpdatedAt,
				nowMs,
			);
			const totalInterestToClaim =
				currentUnclaimedInterest + newlyAccruedInterest;

			if (totalInterestToClaim <= 1e-12) {
				return { success: false as const, error: "Nothing to collect yet" };
			}

			const maxCanClaim = isSelfVerified
				? totalInterestToClaim
				: Math.max(
						0,
						BASIC_INCOME_BALANCE_CAP - basicIncomeAndInterestClaimedTotal,
					);
			const finalClaimable = Math.min(totalInterestToClaim, maxCanClaim);

			if (finalClaimable <= 1e-12) {
				return { success: false as const, error: "Balance cap reached" };
			}

			await tx
				.update(userProfiles)
				.set({
					walletBalance: (currentWalletBalance + finalClaimable).toFixed(18),
					basicIncomeAndInterestClaimedTotal: (
						basicIncomeAndInterestClaimedTotal + finalClaimable
					).toFixed(18),
					unclaimedSavingsInterest: (
						totalInterestToClaim - finalClaimable
					).toFixed(18),
					savingsLastUpdatedAt: now,
					updatedAt: now,
				})
				.where(eq(userProfiles.id, userUuid));

			await tx.insert(transactions).values({
				userId: userUuid,
				type: "SAVINGS_INTEREST_CLAIM",
				amount: finalClaimable.toFixed(18),
			});

			return { success: true as const, claimedAmount: finalClaimable };
		});

		if (result.success) {
			revalidatePath("/[lang]", "page");
			revalidatePath("/[lang]/menu/wallet", "page");
		}

		return result;
	} catch (error) {
		console.error("Error claiming savings interest:", error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Could not claim savings interest",
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

		// Revalidate paths and cache tags that show user profile and parties.
		// Username appears in: parties (leaderUsername), ambassador leaderboard
		// (userProfiles.username), and subsidy leaderboard (parties.leaderUsername).
		revalidatePath("/[lang]/menu/account", "page");
		revalidatePath("/[lang]/govern", "page");
		revalidatePath("/[lang]/govern/parties/[id]", "page");
		revalidatePath("/[lang]/parties", "page");
		revalidateTag("parties-list", "default");
		revalidateTag("ambassador-leaderboard", "default");
		revalidateTag("subsidy-leaderboard", "default");

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
