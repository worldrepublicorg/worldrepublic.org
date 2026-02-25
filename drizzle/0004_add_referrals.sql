-- Add referral_code column to user_profiles and create referrals table.

-- Step 1: Add referral_code as nullable (existing rows don't have one yet)
ALTER TABLE user_profiles ADD COLUMN referral_code VARCHAR(8);

-- Step 2: Backfill existing rows with random 8-char codes
-- Charset: ABCDEFGHJKMNPQRSTUVWXYZ23456789 (no ambiguous 0/O/1/I/L)
-- Uses CTE to force per-row evaluation of random()
WITH new_codes AS (
  SELECT
    id,
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) ||
    substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1) AS code
  FROM user_profiles
)
UPDATE user_profiles up
SET referral_code = nc.code
FROM new_codes nc
WHERE up.id = nc.id;

-- Step 3: Add NOT NULL constraint and unique index
ALTER TABLE user_profiles ALTER COLUMN referral_code SET NOT NULL;
CREATE UNIQUE INDEX user_profiles_referral_code_idx ON user_profiles (referral_code);

-- Step 4: Create referrals table
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  referrer_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX referrals_referred_id_idx ON referrals (referred_id);
CREATE INDEX referrals_referrer_id_idx ON referrals (referrer_id);
