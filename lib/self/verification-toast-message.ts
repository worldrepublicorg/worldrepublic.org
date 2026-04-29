/** Maps Self account-verification API `lastError` / status to ultra-short English toast titles (narrow screens). */

export function mapSelfVerificationToast(
  lastError: string | null | undefined,
  status: string,
): string {
  if (status === "expired") {
    return "Expired, retry";
  }

  const reason = lastError ?? "";

  const exact: Record<string, string> = {
    "Self ID already linked to another account": "Linked elsewhere",
    "Verified identity does not match authenticated account": "Wrong account",
    "Verification failed": "Failed",
    "Verification session expired": "Expired, retry",
    "Session token expired": "Expired, retry",
    "Verification session not found": "Expired, retry",
    "Nullifier or user identifier missing in verification result": "Incomplete",
    "Session user mismatch": "Wrong session",
    "Verification session already completed": "Failed",
    "Verification session does not belong to current user": "Wrong session",
    "Missing session token": "Failed",
    "Invalid session token format": "Failed",
    "Invalid session token signature": "Failed",
    "Invalid session token payload": "Failed",
  };

  if (exact[reason]) {
    return exact[reason];
  }

  return "Failed";
}
