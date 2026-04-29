import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

type VerificationSessionStatus = "pending" | "verified" | "failed" | "expired";

type VerificationSessionRecord = {
  sessionId: string;
  userUuid: string;
  expiresAt: number;
  status: VerificationSessionStatus;
  createdAt: number;
  verifiedAt: number | null;
  lastError: string | null;
};

type VerificationSessionTokenPayload = {
  v: 1;
  sessionId: string;
  userUuid: string;
  exp: number;
};

type ValidationResult =
  | {
      ok: true;
      payload: VerificationSessionTokenPayload;
      session: VerificationSessionRecord;
    }
  | {
      ok: false;
      reason: string;
      sessionId?: string;
    };

const SESSION_TTL_MS = 10 * 60 * 1000;

const asBase64Url = (input: string): string =>
  Buffer.from(input, "utf8").toString("base64url");

const fromBase64Url = (input: string): string =>
  Buffer.from(input, "base64url").toString("utf8");

function getSigningSecret(): string {
  const secret =
    process.env.SELF_VERIFICATION_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SELF_VERIFICATION_SESSION_SECRET (or AUTH_SECRET/NEXTAUTH_SECRET)",
    );
  }
  return secret;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSigningSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function safeJsonParse<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}

function getStore(): Map<string, VerificationSessionRecord> {
  const globalRef = globalThis as typeof globalThis & {
    __wrSelfVerificationSessionStore?: Map<string, VerificationSessionRecord>;
  };
  if (!globalRef.__wrSelfVerificationSessionStore) {
    globalRef.__wrSelfVerificationSessionStore = new Map();
  }
  return globalRef.__wrSelfVerificationSessionStore;
}

function markExpiredIfNeeded(
  record: VerificationSessionRecord,
): VerificationSessionRecord {
  if (record.status === "pending" && record.expiresAt <= Date.now()) {
    record.status = "expired";
    record.lastError = "Session expired";
  }
  return record;
}

export function createAccountVerificationSession(userUuid: string): {
  sessionId: string;
  token: string;
  expiresAt: number;
} {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload: VerificationSessionTokenPayload = {
    v: 1,
    sessionId,
    userUuid,
    exp: expiresAt,
  };

  const encodedPayload = asBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;

  const store = getStore();
  store.set(sessionId, {
    sessionId,
    userUuid,
    expiresAt,
    status: "pending",
    createdAt: Date.now(),
    verifiedAt: null,
    lastError: null,
  });

  return { sessionId, token, expiresAt };
}

export function validateAccountVerificationSessionToken(
  token: string,
): ValidationResult {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "Missing session token" };
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return { ok: false, reason: "Invalid session token format" };
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuf = Buffer.from(signature, "utf8");
  const expectedBuf = Buffer.from(expectedSignature, "utf8");
  if (
    signatureBuf.length !== expectedBuf.length ||
    !timingSafeEqual(signatureBuf, expectedBuf)
  ) {
    return { ok: false, reason: "Invalid session token signature" };
  }

  const payload = safeJsonParse<VerificationSessionTokenPayload>(
    fromBase64Url(encodedPayload),
  );
  if (!payload || payload.v !== 1 || !payload.sessionId || !payload.userUuid) {
    return { ok: false, reason: "Invalid session token payload" };
  }

  if (payload.exp <= Date.now()) {
    const maybeSession = getStore().get(payload.sessionId);
    if (maybeSession) {
      maybeSession.status = "expired";
      maybeSession.lastError = "Session expired";
    }
    return {
      ok: false,
      reason: "Session token expired",
      sessionId: payload.sessionId,
    };
  }

  const session = getStore().get(payload.sessionId);
  if (!session) {
    return {
      ok: false,
      reason: "Verification session not found",
      sessionId: payload.sessionId,
    };
  }

  markExpiredIfNeeded(session);
  if (session.status === "expired") {
    return {
      ok: false,
      reason: "Verification session expired",
      sessionId: payload.sessionId,
    };
  }
  if (session.status === "verified") {
    return {
      ok: false,
      reason: "Verification session already completed",
      sessionId: payload.sessionId,
    };
  }

  if (session.userUuid.toLowerCase() !== payload.userUuid.toLowerCase()) {
    return {
      ok: false,
      reason: "Session user mismatch",
      sessionId: payload.sessionId,
    };
  }

  return { ok: true, payload, session };
}

export function markAccountVerificationSessionVerified(
  sessionId: string | undefined,
): void {
  if (!sessionId) return;
  const session = getStore().get(sessionId);
  if (!session) return;
  session.status = "verified";
  session.verifiedAt = Date.now();
  session.lastError = null;
}

export function markAccountVerificationSessionFailed(
  sessionId: string | undefined,
  reason: string,
): void {
  if (!sessionId) return;
  const session = getStore().get(sessionId);
  if (!session || session.status !== "pending") return;
  session.status = "failed";
  session.lastError = reason;
}

export function getAccountVerificationSession(
  sessionId: string,
): VerificationSessionRecord | null {
  const session = getStore().get(sessionId);
  if (!session) return null;
  return markExpiredIfNeeded(session);
}
