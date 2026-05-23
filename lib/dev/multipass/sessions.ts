import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { multipassDevSessions } from "@/lib/db/schema";

export type MultipassDevSession = {
	id: string;
	createdAt: number;
	verifiedAt?: number;
	nullifier?: string;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function rowToSession(
	row: typeof multipassDevSessions.$inferSelect,
): MultipassDevSession {
	return {
		id: row.id,
		createdAt: row.createdAt.getTime(),
		verifiedAt: row.verifiedAt?.getTime(),
		nullifier: row.nullifier ?? undefined,
	};
}

async function expirePendingSessionIfStale(id: string): Promise<void> {
	await db
		.update(multipassDevSessions)
		.set({ status: "expired" })
		.where(
			and(
				eq(multipassDevSessions.id, id),
				eq(multipassDevSessions.status, "pending"),
			),
		);
}

async function loadSession(
	id: string,
): Promise<MultipassDevSession | undefined> {
	const [row] = await db
		.select()
		.from(multipassDevSessions)
		.where(eq(multipassDevSessions.id, id))
		.limit(1);

	if (!row) {
		return undefined;
	}

	if (row.status === "pending" && row.expiresAt.getTime() <= Date.now()) {
		await expirePendingSessionIfStale(id);
		return undefined;
	}

	if (row.status === "expired") {
		return undefined;
	}

	return rowToSession(row);
}

export async function createMultipassDevSession(): Promise<MultipassDevSession> {
	const id = randomUUID();
	const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

	await db.insert(multipassDevSessions).values({
		id,
		status: "pending",
		nullifier: null,
		verifiedAt: null,
		expiresAt,
	});

	return {
		id,
		createdAt: Date.now(),
	};
}

export async function getMultipassDevSession(
	id: string,
): Promise<MultipassDevSession | undefined> {
	return loadSession(id);
}

export async function markMultipassDevSessionVerified(
	id: string,
	nullifier: string,
): Promise<MultipassDevSession | undefined> {
	const verifiedAt = new Date();

	const [row] = await db
		.update(multipassDevSessions)
		.set({
			status: "verified",
			nullifier,
			verifiedAt,
		})
		.where(
			and(
				eq(multipassDevSessions.id, id),
				eq(multipassDevSessions.status, "pending"),
			),
		)
		.returning();

	if (!row) {
		return loadSession(id);
	}

	return rowToSession(row);
}

export type MultipassDevSessionStatusResponse = {
	verified: boolean;
	nullifier?: string;
	verifiedAt?: number;
};

export async function getMultipassDevSessionStatus(
	id: string,
): Promise<MultipassDevSessionStatusResponse | undefined> {
	const [row] = await db
		.select()
		.from(multipassDevSessions)
		.where(eq(multipassDevSessions.id, id))
		.limit(1);

	if (!row) {
		return undefined;
	}

	if (row.status === "pending" && row.expiresAt.getTime() <= Date.now()) {
		await expirePendingSessionIfStale(id);
		return undefined;
	}

	if (row.status === "expired") {
		return undefined;
	}

	return {
		verified: row.status === "verified",
		nullifier: row.nullifier ?? undefined,
		verifiedAt: row.verifiedAt?.getTime(),
	};
}

/** Public origin for verifyUrl; prefers NEXTAUTH_URL when set. */
export function getMultipassDevOrigin(request: Request): string {
	const fromEnv = process.env.NEXTAUTH_URL?.trim().replace(/\/$/, "");
	if (fromEnv) {
		return fromEnv;
	}
	const url = new URL(request.url);
	const host = request.headers.get("x-forwarded-host") ?? url.host;
	const proto =
		request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
	return `${proto}://${host}`;
}

export function multipassVerifyUrl(origin: string, sessionId: string): string {
	return `${origin}/api/dev/multipass/sessions/${sessionId}`;
}
