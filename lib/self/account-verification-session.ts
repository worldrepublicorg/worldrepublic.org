import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { selfVerificationSessions } from "@/lib/db/schema";

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

const SESSION_TTL_MS = 30 * 60 * 1000;

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

function rowToRecord(
	row: typeof selfVerificationSessions.$inferSelect,
): VerificationSessionRecord {
	return {
		sessionId: row.sessionId,
		userUuid: row.userId,
		expiresAt: row.expiresAt.getTime(),
		status: row.status as VerificationSessionStatus,
		createdAt: row.createdAt.getTime(),
		verifiedAt: row.verifiedAt?.getTime() ?? null,
		lastError: row.lastError,
	};
}

async function expirePendingSessionIfStale(
	sessionId: string,
	lastError: string,
): Promise<void> {
	await db
		.update(selfVerificationSessions)
		.set({
			status: "expired",
			lastError,
		})
		.where(
			and(
				eq(selfVerificationSessions.sessionId, sessionId),
				eq(selfVerificationSessions.status, "pending"),
			),
		);
}

async function normalizeExpiredRecord(
	row: typeof selfVerificationSessions.$inferSelect,
): Promise<VerificationSessionRecord> {
	const record = rowToRecord(row);
	if (record.status === "pending" && record.expiresAt <= Date.now()) {
		await expirePendingSessionIfStale(
			record.sessionId,
			"Verification session expired",
		);
		return {
			...record,
			status: "expired",
			lastError: "Verification session expired",
		};
	}
	return record;
}

export async function createAccountVerificationSession(
	userUuid: string,
): Promise<{
	sessionId: string;
	token: string;
	expiresAt: number;
}> {
	const sessionId = randomUUID();
	const expiresAtMs = Date.now() + SESSION_TTL_MS;
	const expiresAtDate = new Date(expiresAtMs);
	const payload: VerificationSessionTokenPayload = {
		v: 1,
		sessionId,
		userUuid,
		exp: expiresAtMs,
	};

	const encodedPayload = asBase64Url(JSON.stringify(payload));
	const signature = signPayload(encodedPayload);
	const token = `${encodedPayload}.${signature}`;

	await db.insert(selfVerificationSessions).values({
		sessionId,
		userId: userUuid,
		status: "pending",
		expiresAt: expiresAtDate,
		verifiedAt: null,
		lastError: null,
	});

	return { sessionId, token, expiresAt: expiresAtMs };
}

export async function validateAccountVerificationSessionToken(
	token: string,
): Promise<ValidationResult> {
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

	const now = Date.now();

	if (payload.exp <= now) {
		await expirePendingSessionIfStale(
			payload.sessionId,
			"Session token expired",
		);
		return {
			ok: false,
			reason: "Session token expired",
			sessionId: payload.sessionId,
		};
	}

	const [row] = await db
		.select()
		.from(selfVerificationSessions)
		.where(eq(selfVerificationSessions.sessionId, payload.sessionId))
		.limit(1);

	if (!row) {
		return {
			ok: false,
			reason: "Verification session not found",
			sessionId: payload.sessionId,
		};
	}

	const session = await normalizeExpiredRecord(row);

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

export async function markAccountVerificationSessionVerified(
	sessionId: string | undefined,
): Promise<void> {
	if (!sessionId) return;
	await db
		.update(selfVerificationSessions)
		.set({
			status: "verified",
			verifiedAt: new Date(),
			lastError: null,
		})
		.where(eq(selfVerificationSessions.sessionId, sessionId));
}

export async function markAccountVerificationSessionFailed(
	sessionId: string | undefined,
	reason: string,
): Promise<void> {
	if (!sessionId) return;
	await db
		.update(selfVerificationSessions)
		.set({
			status: "failed",
			lastError: reason,
		})
		.where(
			and(
				eq(selfVerificationSessions.sessionId, sessionId),
				eq(selfVerificationSessions.status, "pending"),
			),
		);
}

export async function getAccountVerificationSession(
	sessionId: string,
): Promise<VerificationSessionRecord | null> {
	const [row] = await db
		.select()
		.from(selfVerificationSessions)
		.where(eq(selfVerificationSessions.sessionId, sessionId))
		.limit(1);

	if (!row) return null;
	return normalizeExpiredRecord(row);
}
