-- Add distributed_at to elections
ALTER TABLE "elections" ADD COLUMN "distributed_at" TIMESTAMP;

-- Add stream columns to transactions
ALTER TABLE "transactions" ADD COLUMN "stream_id" UUID;
ALTER TABLE "transactions" ADD COLUMN "stream_type" VARCHAR(20);

-- Create streams table
CREATE TABLE "streams" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("uuid") ON DELETE CASCADE,
  "type" VARCHAR(20) NOT NULL,
  "election_id" UUID NOT NULL REFERENCES "elections"("id") ON DELETE CASCADE,
  "party_id" UUID NOT NULL REFERENCES "parties"("id") ON DELETE CASCADE,
  "total_amount" DECIMAL(36,18) NOT NULL,
  "initial_amount" DECIMAL(36,18) NOT NULL DEFAULT '0',
  "withdrawn_amount" DECIMAL(36,18) NOT NULL DEFAULT '0',
  "rate_per_second" DECIMAL(36,18) NOT NULL,
  "started_at" TIMESTAMP NOT NULL,
  "ends_at" TIMESTAMP NOT NULL,
  "source_stream_id" UUID,
  "created_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX "streams_user_id_idx" ON "streams" ("user_id");
CREATE INDEX "streams_user_type_idx" ON "streams" ("user_id", "type");
CREATE INDEX "streams_election_id_idx" ON "streams" ("election_id");
