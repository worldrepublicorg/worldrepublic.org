-- Make partyId and electionId nullable on streams (for BASIC_INCOME streams)
ALTER TABLE "streams" ALTER COLUMN "election_id" DROP NOT NULL;
ALTER TABLE "streams" ALTER COLUMN "party_id" DROP NOT NULL;

-- Add basic income tracking columns to user_profiles
ALTER TABLE "user_profiles" ADD COLUMN "basic_income_activated_at" TIMESTAMP;
ALTER TABLE "user_profiles" ADD COLUMN "last_basic_income_claim_at" TIMESTAMP;
