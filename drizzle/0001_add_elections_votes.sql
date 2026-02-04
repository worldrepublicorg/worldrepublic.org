-- Elections table - scheduled elections with start/end times
CREATE TABLE "elections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Votes table - one vote per person per election
CREATE TABLE "votes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "votes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"election_id" uuid NOT NULL,
	"self_nullifier" text NOT NULL,
	"party_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Foreign key constraints
ALTER TABLE "votes" ADD CONSTRAINT "votes_election_id_elections_id_fk" FOREIGN KEY ("election_id") REFERENCES "public"."elections"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Indexes for elections
CREATE INDEX "elections_starts_at_idx" ON "elections" USING btree ("starts_at");
--> statement-breakpoint
CREATE INDEX "elections_ends_at_idx" ON "elections" USING btree ("ends_at");
--> statement-breakpoint
-- Indexes for votes
CREATE UNIQUE INDEX "votes_election_nullifier_idx" ON "votes" USING btree ("election_id","self_nullifier");
--> statement-breakpoint
CREATE INDEX "votes_party_id_idx" ON "votes" USING btree ("party_id");
--> statement-breakpoint
CREATE INDEX "votes_election_id_idx" ON "votes" USING btree ("election_id");
