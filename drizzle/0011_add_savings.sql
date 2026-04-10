ALTER TABLE "user_profiles"
ADD COLUMN "savings_balance" numeric(36, 18) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_profiles"
ADD COLUMN "unclaimed_savings_interest" numeric(36, 18) DEFAULT '0' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_profiles"
ADD COLUMN "savings_last_updated_at" timestamp;
