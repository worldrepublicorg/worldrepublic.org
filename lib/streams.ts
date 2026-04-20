export interface StreamData {
  id: string;
  type: "SUBSIDY" | "AMBASSADOR" | "BASIC_INCOME";
  totalAmount: number;
  initialAmount: number;
  withdrawnAmount: number;
  ratePerSecond: number;
  startedAt: number; // ms timestamp
  endsAt: number; // ms timestamp
  partyId: string | null;
  electionId: string | null;
}

const STREAM_DURATION_S = 365 * 24 * 3600;

export function computeStreamAccrued(
  stream: StreamData,
  nowMs: number,
): number {
  const durationMs = stream.endsAt - stream.startedAt;
  const elapsedMs = Math.min(Math.max(0, nowMs - stream.startedAt), durationMs);
  const elapsedSec = elapsedMs / 1000;
  return stream.initialAmount + stream.ratePerSecond * elapsedSec;
}

/**
 * Compute withdrawable balance from streams, excluding BASIC_INCOME streams.
 * BI streams are excluded because they require an explicit claim action.
 */
export function computeWalletBalance(
  streams: StreamData[],
  nowMs: number,
): number {
  let totalAccrued = 0;
  let totalWithdrawn = 0;
  for (const s of streams) {
    if (s.type === "BASIC_INCOME") continue;
    totalAccrued += computeStreamAccrued(s, nowMs);
    totalWithdrawn += s.withdrawnAmount;
  }
  return Math.max(0, totalAccrued - totalWithdrawn);
}

export function computeTotalRatePerSecond(
  streams: StreamData[],
  nowMs: number,
): number {
  let rate = 0;
  for (const s of streams) {
    if (s.type === "BASIC_INCOME") continue;
    if (nowMs >= s.startedAt && nowMs < s.endsAt) {
      rate += s.ratePerSecond;
    }
  }
  return rate;
}

export { STREAM_DURATION_S };
