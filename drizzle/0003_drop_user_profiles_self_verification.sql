-- Drop Self verification columns from user_profiles (unused; verification is per-vote in votes table).
DROP INDEX IF EXISTS user_profiles_self_nullifier_idx;
DROP INDEX IF EXISTS user_profiles_active_verified_idx;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS self_verified_at;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS self_nullifier;
