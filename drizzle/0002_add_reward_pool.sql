-- Add reward_pool column to elections table
ALTER TABLE "elections" ADD COLUMN "reward_pool" numeric(36, 18) DEFAULT '0' NOT NULL;
--> statement-breakpoint
