import "server-only";

import { randomUUID } from "node:crypto";

export type MultipassDevSession = {
	id: string;
	createdAt: number;
};

const globalForSessions = globalThis as typeof globalThis & {
	__multipassDevSessions?: Map<string, MultipassDevSession>;
};

function sessionStore(): Map<string, MultipassDevSession> {
	if (!globalForSessions.__multipassDevSessions) {
		globalForSessions.__multipassDevSessions = new Map();
	}
	return globalForSessions.__multipassDevSessions;
}

export function createMultipassDevSession(): MultipassDevSession {
	const session: MultipassDevSession = {
		id: randomUUID(),
		createdAt: Date.now(),
	};
	sessionStore().set(session.id, session);
	return session;
}

export function getMultipassDevSession(
	id: string,
): MultipassDevSession | undefined {
	return sessionStore().get(id);
}

/** Public origin for verifyUrl (tunnel / deploy must set NEXTAUTH_URL). */
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
