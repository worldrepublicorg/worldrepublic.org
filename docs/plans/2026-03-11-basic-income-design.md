# Basic Income Feature Design

**Date:** 2026-03-11  
**Status:** Approved — ready for implementation  
**Target repo:** `world-republic`  
**Reference implementation:** `world-republic-pwa`

---

## Summary

Add a daily-claim basic income feature to the wallet. Every authenticated user can activate basic income once, then claim up to **1 WDD per day**. Missed days are forfeited — earning is maximized only by returning before 24 hours elapse. Unverified users are capped at a **10 WDD total holdings** ceiling until identity verification is added.

---

## Behavioral Rules

| Rule | Value |
|------|-------|
| Emission rate | 1 WDD per day (accrues continuously) |
| Max claimable per claim | `min(elapsedDays, 1)` |
| Missed day treatment | Forfeited (strictly discourages skipping) |
| Unverified total holdings cap | 10 WDD |
| Activation | Explicit one-time action per user |
| Claim | Explicit per-claim action (not automatic) |

---

## Architecture

### What this is NOT

Basic income is **not** modeled as a stream in the `streams` table. That table requires `electionId` and `partyId` (both non-nullable) because it was designed for election-driven subsidies. Basic income is user-activated and election-independent. Forcing it into that shape would require nullable FK columns and conceptual pollution.

### How balance is credited

On a successful claim, `user_profiles.walletBalance` is incremented directly in a Drizzle transaction — exactly as the PWA does with Redis. Withdrawals already read from `walletBalance`, so no further plumbing is needed.

---

## Database Changes

### Migration: two new columns on `user_profiles`

```sql
ALTER TABLE user_profiles
  ADD COLUMN basic_income_activated_at TIMESTAMP,
  ADD COLUMN last_basic_income_claim_at TIMESTAMP;
```

Both nullable. Null `basic_income_activated_at` means the user has not activated yet.

### Drizzle schema additions (`lib/db/schema.ts`)

```ts
basicIncomeActivatedAt: timestamp("basic_income_activated_at"),
lastBasicIncomeClaimAt: timestamp("last_basic_income_claim_at"),
```

A Drizzle migration file must be generated and committed alongside the schema change.

---

## Verification Placeholder (`lib/utils.ts`)

Add `calculateMaxClaimableAmount` (mirrors the PWA utility exactly):

```ts
export const MAX_UNVERIFIED_BALANCE = 10;

export function calculateMaxClaimableAmount(
  walletBalance: number | null,
  isVerified: boolean,
  maxUnverifiedBalance = MAX_UNVERIFIED_BALANCE,
): number {
  if (isVerified) return Infinity;
  const current = walletBalance ?? 0;
  return Math.max(0, maxUnverifiedBalance - current);
}
```

The `isVerified` parameter always receives `false` until real verification is wired in. A single `isUserVerified(userUuid: string): Promise<boolean>` stub in `lib/auth/verification.ts` (returns `false`) makes the future wire-up a one-line change.

---

## Server Actions (`lib/actions/member.ts`)

### `activateBasicIncome()`

```
1. Verify session (existing verifyUserAccess pattern)
2. Load userProfiles row by UUID
3. If basicIncomeActivatedAt is already set → return { success: false, error: "Already activated" }
4. Set basicIncomeActivatedAt = now, lastBasicIncomeClaimAt = now
5. Commit in Drizzle transaction
6. Return { success: true }
```

### `claimBasicIncome()`

```
1. Verify session
2. Load profile (SELECT ... FOR UPDATE to prevent concurrent claims)
3. If basicIncomeActivatedAt is null → error "Not activated"
4. anchor = lastBasicIncomeClaimAt ?? basicIncomeActivatedAt
5. elapsedMs = Date.now() - anchor
6. elapsedDays = elapsedMs / 86_400_000
7. cappedClaimable = min(elapsedDays, 1)
8. isVerified = await isUserVerified(userUuid)   // returns false for now
9. maxCanClaim = calculateMaxClaimableAmount(walletBalance, isVerified)
10. finalClaimable = min(cappedClaimable, maxCanClaim)
11. If finalClaimable <= 0:
    - If at cap: return { success: false, error: "Verify to continue claiming" }
    - If nothing accrued yet: return { success: false, error: "Nothing to claim yet" }
12. DB transaction:
    - walletBalance += finalClaimable
    - lastBasicIncomeClaimAt = now
    - updatedAt = now
13. Return { success: true, claimedAmount: finalClaimable }
```

### `getWalletAuthAndData()` — extend return type

Add to `GetWalletAuthAndDataProfileData`:
```ts
basicIncomeActivatedAt: number | null;   // ms timestamp
lastBasicIncomeClaimAt: number | null;   // ms timestamp
```

Fetch from `userProfiles` and populate alongside existing fields. This avoids an extra client-side round-trip.

Also update `wallet-auth-cache.ts` to include these two fields in the cached shape so the UI hydrates correctly from localStorage on navigation.

---

## Client Hook (`hooks/use-basic-income.ts`)

```ts
export function useBasicIncome(
  basicIncomeActivatedAt: number | null,
  lastBasicIncomeClaimAt: number | null,
  walletBalance: number | null,
  isAuthenticated: boolean,
  onSuccess: () => void,  // triggers getWalletAuthAndData refetch
)
```

**State:**
- `claimableAmount: number` — live-ticking via `setInterval(1000ms)`
- `maxClaimableAmount: number` — clamp against verification ceiling
- `isActivating: boolean`
- `isClaiming: boolean`

**Tick math (client-side for display only — server always recomputes):**
```ts
const anchor = lastBasicIncomeClaimAt ?? basicIncomeActivatedAt;
const elapsedDays = (Date.now() - anchor) / 86_400_000;
const claimable = Math.max(0, Math.min(elapsedDays, 1));
```

`maxClaimableAmount` applies the 10 WDD ceiling for display (same util as server).  
Server recomputes independently — client value is display-only.

---

## UI Placement

No `/earn` route exists in `world-republic`. The feature lives inside the wallet page (`app/[lang]/wallet/page-client.tsx`) as a new collapsible section or tab below the balance display, above Transaction History. Suggested approach: a new `<BasicIncomeSection>` component in `components/wallet/`.

### Three UI states

**1. Not activated**
- Icon + heading "Basic Income"
- Subtitle: "Earn 1 WDD per day just for being a member"
- Button: "Activate"

**2. Activated — accruing**
- Live 6-decimal counter ticking up
- Subtitle explaining the daily cap and forfeiture mechanic
- Button: "Claim" (disabled if `maxClaimableAmount <= 0`)
- Confirm `AlertDialog` before claiming (shows exact amount)
- Contextual disabled text when at 10 WDD cap: "Verify your identity to continue"

**3. Unauthenticated**
- Sign-in prompt (reuse existing `SignInDialog` pattern)

---

## Edge Cases & Error Handling

| Scenario | Server behaviour | Client behaviour |
|---|---|---|
| Claim before 1 full day | Returns sub-1 WDD amount | Counter shows partial amount; claim succeeds |
| User skips 3 days | Caps at 1 WDD; 2 WDD forfeited permanently | Counter shows "1.000000" (max) |
| Nothing accrued yet (just claimed) | `{ success: false, error: "Nothing to claim yet" }` | Button disabled; no error toast |
| At 10 WDD unverified cap | `{ success: false, error: "Verify to continue claiming" }` | Button disabled with verification prompt |
| Concurrent double-claim | `SELECT FOR UPDATE` ensures only one succeeds | Button disabled during `isClaiming` |
| Wrong user calls action | `verifyUserAccess()` throws Unauthorized | Generic error toast |
| DB transaction failure | Returns `{ success: false }` | Error toast; balance not updated client-side |

---

## Files to Create or Modify

| File | Change |
|---|---|
| `lib/db/schema.ts` | Add `basicIncomeActivatedAt`, `lastBasicIncomeClaimAt` to `userProfiles` |
| `drizzle/` | New migration file for the two columns |
| `lib/utils.ts` | Add `calculateMaxClaimableAmount`, `MAX_UNVERIFIED_BALANCE` |
| `lib/auth/verification.ts` | New file — `isUserVerified()` stub returning `false` |
| `lib/actions/member.ts` | Add `activateBasicIncome()`, `claimBasicIncome()`; extend `getWalletAuthAndData` return type |
| `lib/wallet-auth-cache.ts` | Add new fields to cached shape |
| `hooks/use-basic-income.ts` | New file — hook with live tick and handlers |
| `components/wallet/basic-income-section.tsx` | New file — three-state UI component |
| `app/[lang]/wallet/page-client.tsx` | Mount `<BasicIncomeSection>` with hook; pass new profile fields |
| `app/[lang]/dictionaries/en.json` | Add `pages.wallet.basic_income.*` and `toasts.basic_income.*` keys |

---

## Dictionary Keys to Add (`en.json`)

```json
"pages": {
  "wallet": {
    "basic_income": {
      "title": "Basic Income",
      "subtitle_activate": "Earn 1 WDD per day just for being a member",
      "subtitle_claim": "Claim your daily WDD. Come back before 24 hours to maximize earnings.",
      "tooltip_claim": "You earn 1 WDD per day. Unused income is forfeited after 24 hours — claim daily to maximize.",
      "activate_button": "Activate",
      "activate_loading": "Activating...",
      "claim_button": "Claim",
      "alert": {
        "claim": {
          "title": "Claim Basic Income",
          "description": "You are about to claim {amount} WDD."
        }
      }
    }
  }
},
"toasts": {
  "basic_income": {
    "activated": "Basic income activated",
    "activate_failed": "Failed to activate",
    "claimed": "Claimed successfully",
    "claim_failed": "Failed to claim"
  }
}
```

---

## Out of Scope (v1)

- No claim history / audit log (can be added later to the `transactions` table)
- No streak bonuses
- No push notifications
- No verification integration (placeholder returns `false`)
- No savings account / interest (separate feature)
