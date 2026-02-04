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
    selfVerifiedAt: timestamp("self_verified_at"),
    selfNullifier: text("self_nullifier"), // Self verification nullifier (unique to prevent duplicate verifications)
    username: varchar("username", { length: 30 }).notNull(), // Required username, auto-generated on profile creation
    accountDeletedAt: timestamp("account_deleted_at"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Note: authUserId already has .unique() on the column, so no explicit index needed
    uniqueIndex("user_profiles_self_nullifier_idx").on(table.selfNullifier),
    // Note: Username unique index with LOWER() is created via raw SQL in migration for case-insensitive uniqueness
    uniqueIndex("user_profiles_username_idx").on(table.username),
    index("user_profiles_account_deleted_at_idx").on(table.accountDeletedAt),
    index("user_profiles_created_at_idx").on(table.createdAt),
    // Composite index for active verified users (common query pattern)
    index("user_profiles_active_verified_idx").on(
      table.accountDeletedAt,
      table.selfVerifiedAt,
    ),
  ],
);

// Relations
export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.id],
    references: [users.uuid],
  }),
}));

// Transactions table - unified transaction records for all transaction types
// Types: WITHDRAWAL, TRANSFER
export const transactions = pgTable(
  "transactions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.uuid, { onDelete: "cascade" }),
    type: varchar("type", { length: 30 }).notNull(), // Transaction type
    amount: decimal("amount", { precision: 36, scale: 18 }).notNull(),
    // For WITHDRAWAL only
    walletAddress: text("wallet_address"), // EVM address (nullable)
    selectedChain: varchar("selected_chain", { length: 10 }), // Chain ID (nullable)
    // For TRANSFER only
    recipientUserId: uuid("recipient_user_id"), // Recipient user UUID (nullable, FK to users.uuid)
    // For WITHDRAWAL: Thirdweb transaction ID
    // For TRANSFER: Internal transaction UUID
    // For internal transactions: null
    transactionId: text("transaction_id"), // Nullable
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    // Composite indexes (removed single-column ones for better performance)
    index("transactions_user_created_idx").on(table.userId, table.createdAt),
    // Index for recipient lookups (for transfers - shows received transfers)
    index("transactions_recipient_created_idx").on(
      table.recipientUserId,
      table.createdAt,
    ),
    // Index for type filtering
    index("transactions_type_created_idx").on(table.type, table.createdAt),
    // Note: Unique index on transactionId (partial, only when not null) is created via raw SQL in migration
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

// Analytics table - language request tracking
export const languageRequests = pgTable("language_requests", {
  locale: text("locale").primaryKey(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
