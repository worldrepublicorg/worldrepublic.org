-- Ensure vote uniqueness is scoped per election, not globally by nullifier.
-- Some environments may still carry a legacy unique constraint/index on self_nullifier.
ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "votes_self_nullifier_key";
DROP INDEX IF EXISTS "votes_self_nullifier_idx";
DROP INDEX IF EXISTS "votes_self_nullifier_key";

-- Re-create the expected unique index to enforce one vote per person per election.
DROP INDEX IF EXISTS "votes_election_nullifier_idx";
CREATE UNIQUE INDEX "votes_election_nullifier_idx"
  ON "votes" USING btree ("election_id", "self_nullifier");
