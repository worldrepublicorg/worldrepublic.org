import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	decimal,
	index,
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// Parties table
// Uses UUIDs for all identifiers
export const parties = pgTable(
	"parties",
	{
		id: uuid("id").primaryKey().defaultRandom(), // UUID instead of text sequence
		name: text("name").notNull(),
		description: text("description"),
		websiteUrl: text("website_url"),
		foundedBy: uuid("founded_by")
			.notNull()
			.references(() => users.uuid, { onDelete: "set null" }), // Allow user deletion
		leaderUsername: varchar("leader_username", { length: 30 }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
		// Soft delete flag for dissolved parties
		dissolvedAt: timestamp("dissolved_at", { mode: "date" }),
	},
	(table) => [
		// Composite indexes for common query patterns
		index("parties_active_created_idx").on(table.dissolvedAt, table.createdAt), // Active parties by creation date
		index("parties_founded_by_idx").on(table.foundedBy),
		// Partial index for active parties only (smaller, faster)
		// Note: Partial indexes need to be created via raw SQL in migration
		// index("parties_active_partial_idx").on(table.createdAt).where(sql`${table.dissolvedAt} IS NULL`),
	],
);

// Relations
export const partiesRelations = relations(parties, ({ one }) => ({
	founder: one(users, {
		fields: [parties.foundedBy],
		references: [users.uuid],
	}),
}));

// AuthJS tables for NextAuth v5 - matching official @auth/neon-adapter schema
export const users = pgTable("users", {
	id: integer("id").primaryKey().generatedAlwaysAsIdentity(), // SERIAL (for AuthJS compatibility)
	uuid: uuid("uuid").unique().notNull().defaultRandom(), // UUID for all app operations
	name: varchar("name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	emailVerified: timestamp("emailVerified", {
		mode: "date",
		withTimezone: true,
	}),
	image: text("image"),
});

export const accounts = pgTable(
	"accounts",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(), // SERIAL
		userId: integer("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: varchar("type", { length: 255 }).notNull(),
		provider: varchar("provider", { length: 255 }).notNull(),
		providerAccountId: varchar("providerAccountId", { length: 255 }).notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: bigint("expires_at", { mode: "number" }),
		id_token: text("id_token"),
		scope: text("scope"),
		session_state: text("session_state"),
		token_type: text("token_type"),
	},
	(account) => [
		index("accounts_provider_providerAccountId_idx").on(
			account.provider,
			account.providerAccountId,
		),
		index("accounts_userId_idx").on(account.userId),
	],
);

export const sessions = pgTable(
	"sessions",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(), // SERIAL
		userId: integer("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
		sessionToken: varchar("sessionToken", { length: 255 }).notNull().unique(),
	},
	(session) => [index("sessions_userId_idx").on(session.userId)],
);

export const verificationTokens = pgTable(
	"verification_token", // Note: singular, not plural
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", {
			mode: "date",
			withTimezone: true,
		}).notNull(),
	},
	(vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// AuthJS relations
export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

// WebAuthn/Passkeys Authenticator table
export const authenticators = pgTable(
	"Authenticator",
	{
		credentialID: text("credentialID").notNull(),
		userId: integer("userId")
			.notNull()
			.references(() => users.id, { onDelete: "cascade", onUpdate: "cascade" }),
		providerAccountId: text("providerAccountId").notNull(),
		credentialPublicKey: text("credentialPublicKey").notNull(),
		counter: integer("counter").notNull(),
		credentialDeviceType: text("credentialDeviceType").notNull(),
		credentialBackedUp: boolean("credentialBackedUp").notNull(),
		transports: text("transports"),
	},
	(authenticator) => [
		uniqueIndex("Authenticator_credentialID_key").on(
			authenticator.credentialID,
		),
		primaryKey({
			columns: [authenticator.userId, authenticator.credentialID],
		}),
	],
);

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
	user: one(users, {
		fields: [authenticators.userId],
		references: [users.id],
	}),
}));

// User Profiles table - for new app users only
// Uses UUID from users table as primary key
export const userProfiles = pgTable(
	"user_profiles",
	{
		id: uuid("id")
			.primaryKey()
			.references(() => users.uuid, { onDelete: "cascade" }), // UUID from users table
		authUserId: integer("auth_user_id")
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: "cascade" }), // For quick lookups by AuthJS ID
		walletBalance: decimal("wallet_balance", { precision: 36, scale: 18 })
			.notNull()
			.default("0"),
		savingsBalance: decimal("savings_balance", { precision: 36, scale: 18 })
			.notNull()
			.default("0"),
		unclaimedSavingsInterest: decimal("unclaimed_savings_interest", {
			precision: 36,
			scale: 18,
		})
			.notNull()
			.default("0"),
		savingsLastUpdatedAt: timestamp("savings_last_updated_at"),
		basicIncomeAndInterestClaimedTotal: decimal(
			"basic_income_and_interest_claimed_total",
			{
				precision: 36,
				scale: 18,
			},
		)
			.notNull()
			.default("0"),
		username: varchar("username", { length: 30 }).notNull(), // Required username, auto-generated on profile creation
		referralCode: varchar("referral_code", { length: 8 }).notNull(), // Unique 8-char code for ambassador referral links
		basicIncomeActivatedAt: timestamp("basic_income_activated_at"),
		lastBasicIncomeClaimAt: timestamp("last_basic_income_claim_at"),
		accountDeletedAt: timestamp("account_deleted_at"),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		// Note: authUserId already has .unique() on the column, so no explicit index needed
		// Note: Username unique index with LOWER() is created via raw SQL in migration for case-insensitive uniqueness
		uniqueIndex("user_profiles_username_idx").on(table.username),
		uniqueIndex("user_profiles_referral_code_idx").on(table.referralCode),
		index("user_profiles_account_deleted_at_idx").on(table.accountDeletedAt),
		index("user_profiles_created_at_idx").on(table.createdAt),
	],
);

// Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(users, {
		fields: [userProfiles.id],
		references: [users.uuid],
	}),
}));

// Account-level Self verification records (independent from vote flow)
export const userSelfVerifications = pgTable(
	"user_self_verifications",
	{
		userId: uuid("user_id")
			.primaryKey()
			.references(() => users.uuid, { onDelete: "cascade" }),
		scope: varchar("scope", { length: 64 }).notNull(),
		selfNullifier: text("self_nullifier").notNull(),
		selfVerifiedAt: timestamp("self_verified_at", { mode: "date" })
			.notNull()
			.defaultNow(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("user_self_verifications_scope_nullifier_idx").on(
			table.scope,
			table.selfNullifier,
		),
	],
);

export const userSelfVerificationsRelations = relations(
	userSelfVerifications,
	({ one }) => ({
		user: one(users, {
			fields: [userSelfVerifications.userId],
			references: [users.uuid],
		}),
	}),
);

/** Ephemeral Self account-verification attempts (QR/session polling); replaces process-local Map storage */
export const selfVerificationSessions = pgTable(
	"self_verification_sessions",
	{
		sessionId: uuid("session_id").primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		status: varchar("status", { length: 16 }).notNull(),
		expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		verifiedAt: timestamp("verified_at", { mode: "date" }),
		lastError: text("last_error"),
	},
	(table) => [
		index("self_verification_sessions_user_idx").on(
			table.userId,
			table.createdAt,
		),
		index("self_verification_sessions_expires_idx").on(table.expiresAt),
	],
);

export const selfVerificationSessionsRelations = relations(
	selfVerificationSessions,
	({ one }) => ({
		user: one(users, {
			fields: [selfVerificationSessions.userId],
			references: [users.uuid],
		}),
	}),
);

// Referrals table - tracks ambassador referral relationships
export const referrals = pgTable(
	"referrals",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		referrerId: uuid("referrer_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		referredId: uuid("referred_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("referrals_referred_id_idx").on(table.referredId),
		index("referrals_referrer_id_idx").on(table.referrerId),
	],
);

export const referralsRelations = relations(referrals, ({ one }) => ({
	referrer: one(users, {
		fields: [referrals.referrerId],
		references: [users.uuid],
		relationName: "referrer",
	}),
	referred: one(users, {
		fields: [referrals.referredId],
		references: [users.uuid],
		relationName: "referred",
	}),
}));

export const referralVerificationRewards = pgTable(
	"referral_verification_rewards",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		referrerId: uuid("referrer_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		referredUserId: uuid("referred_user_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		scope: varchar("scope", { length: 64 }).notNull(),
		selfNullifier: text("self_nullifier").notNull(),
		rewardType: varchar("reward_type", { length: 64 }).notNull(),
		amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("ref_verif_rewards_scope_nullifier_type_idx").on(
			table.scope,
			table.selfNullifier,
			table.rewardType,
		),
		index("ref_verif_rewards_referrer_created_idx").on(
			table.referrerId,
			table.createdAt,
		),
		index("ref_verif_rewards_referred_created_idx").on(
			table.referredUserId,
			table.createdAt,
		),
	],
);

export const referralVerificationRewardsRelations = relations(
	referralVerificationRewards,
	({ one }) => ({
		referrer: one(users, {
			fields: [referralVerificationRewards.referrerId],
			references: [users.uuid],
			relationName: "referral_reward_referrer",
		}),
		referredUser: one(users, {
			fields: [referralVerificationRewards.referredUserId],
			references: [users.uuid],
			relationName: "referral_reward_referred_user",
		}),
	}),
);

// Transactions table - unified transaction records for all transaction types
// Types: WITHDRAWAL, TRANSFER, STREAM_CREATED, STREAM_UPDATED
export const transactions = pgTable(
	"transactions",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		type: varchar("type", { length: 30 }).notNull(),
		amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
		// For WITHDRAWAL only
		walletAddress: text("wallet_address"),
		selectedChain: varchar("selected_chain", { length: 10 }),
		// For TRANSFER only
		recipientUserId: uuid("recipient_user_id"),
		// For WITHDRAWAL: Thirdweb transaction ID
		// For TRANSFER: Internal transaction UUID
		transactionId: text("transaction_id"),
		// For STREAM_CREATED / STREAM_UPDATED only
		streamId: uuid("stream_id"),
		streamType: varchar("stream_type", { length: 20 }), // "SUBSIDY" | "AMBASSADOR"
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("transactions_user_created_idx").on(table.userId, table.createdAt),
		index("transactions_recipient_created_idx").on(
			table.recipientUserId,
			table.createdAt,
		),
		index("transactions_type_created_idx").on(table.type, table.createdAt),
	],
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.uuid],
	}),
	recipient: one(users, {
		fields: [transactions.recipientUserId],
		references: [users.uuid],
		relationName: "recipient",
	}),
}));

// Elections table - scheduled elections with start/end times
export const elections = pgTable(
	"elections",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		name: text("name").notNull(),
		startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
		endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
		rewardPool: decimal("reward_pool", { precision: 36, scale: 18 })
			.notNull()
			.default("0"),
		distributedAt: timestamp("distributed_at", { mode: "date" }),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("elections_starts_at_idx").on(table.startsAt),
		index("elections_ends_at_idx").on(table.endsAt),
	],
);

// Votes table - one vote per person per election
export const votes = pgTable(
	"votes",
	{
		id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
		electionId: uuid("election_id")
			.notNull()
			.references(() => elections.id, { onDelete: "cascade" }),
		selfNullifier: text("self_nullifier").notNull(),
		partyId: uuid("party_id")
			.notNull()
			.references(() => parties.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		// One vote per person per election
		uniqueIndex("votes_election_nullifier_idx").on(
			table.electionId,
			table.selfNullifier,
		),
		index("votes_party_id_idx").on(table.partyId),
		index("votes_election_id_idx").on(table.electionId),
	],
);

// Elections relations
export const electionsRelations = relations(elections, ({ many }) => ({
	votes: many(votes),
}));

// Votes relations
export const votesRelations = relations(votes, ({ one }) => ({
	election: one(elections, {
		fields: [votes.electionId],
		references: [elections.id],
	}),
	party: one(parties, {
		fields: [votes.partyId],
		references: [parties.id],
	}),
}));

// Streams table - linear vesting streams for subsidies and ambassador rewards
export const streams = pgTable(
	"streams",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.uuid, { onDelete: "cascade" }),
		type: varchar("type", { length: 20 }).notNull(), // "SUBSIDY" | "AMBASSADOR" | "BASIC_INCOME"
		electionId: uuid("election_id").references(() => elections.id, {
			onDelete: "cascade",
		}),
		partyId: uuid("party_id").references(() => parties.id, {
			onDelete: "cascade",
		}),
		totalAmount: decimal("total_amount", {
			precision: 36,
			scale: 18,
		}).notNull(),
		initialAmount: decimal("initial_amount", { precision: 36, scale: 18 })
			.notNull()
			.default("0"),
		withdrawnAmount: decimal("withdrawn_amount", { precision: 36, scale: 18 })
			.notNull()
			.default("0"),
		ratePerSecond: decimal("rate_per_second", {
			precision: 36,
			scale: 18,
		}).notNull(),
		startedAt: timestamp("started_at", { mode: "date" }).notNull(),
		endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
		sourceStreamId: uuid("source_stream_id"),
		createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
	},
	(table) => [
		index("streams_user_id_idx").on(table.userId),
		index("streams_user_type_idx").on(table.userId, table.type),
		index("streams_election_id_idx").on(table.electionId),
	],
);

export const streamsRelations = relations(streams, ({ one }) => ({
	user: one(users, {
		fields: [streams.userId],
		references: [users.uuid],
	}),
	election: one(elections, {
		fields: [streams.electionId],
		references: [elections.id],
	}),
	party: one(parties, {
		fields: [streams.partyId],
		references: [parties.id],
	}),
}));

// Analytics table - language request tracking
export const languageRequests = pgTable("language_requests", {
	locale: text("locale").primaryKey(),
	count: integer("count").notNull().default(0),
	updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
