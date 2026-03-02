export interface StreamData {
  id: string;
  type: "SUBSIDY" | "AMBASSADOR";
  totalAmount: number;
  initialAmount: number;
  withdrawnAmount: number;
  ratePerSecond: number;
  startedAt: number; // ms timestamp
  endsAt: number; // ms timestamp
  partyId: string;
  electionId: string;
}

const STREAM_DURATION_S = 365 * 24 * 3600;

export function computeStreamAccrued(
  stream: StreamData,
  nowMs: number,
): number {
  const durationMs = stream.endsAt - stream.startedAt;
  const elapsedMs = Math.min(
    Math.max(0, nowMs - stream.startedAt),
    durationMs,
  );
  const elapsedSec = elapsedMs / 1000;
  return stream.initialAmount + stream.ratePerSecond * elapsedSec;
}

export function computeWalletBalance(
  streams: StreamData[],
  nowMs: number,
): number {
  let totalAccrued = 0;
  let totalWithdrawn = 0;
  for (const s of streams) {
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
    if (nowMs >= s.startedAt && nowMs < s.endsAt) {
      rate += s.ratePerSecond;
    }
  }
  return rate;
}

export { STREAM_DURATION_S };
