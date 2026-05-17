import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { getAccountVerificationSession } from "@/lib/self/account-verification-session";

async function getAuthenticatedUserUuid(): Promise<string | null> {
	const session = await auth();
	if (!session?.user?.id) return null;

	const authUserId = Number.parseInt(String(session.user.id), 10);
	if (Number.isNaN(authUserId)) return null;

	const [user] = await db
		.select({ uuid: users.uuid })
		.from(users)
		.where(eq(users.id, authUserId))
		.limit(1);

	return user?.uuid ?? null;
}

export async function GET(
	_req: Request,
	context: { params: Promise<{ sessionId: string }> },
) {
	try {
		const userUuid = await getAuthenticatedUserUuid();
		if (!userUuid) {
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Authentication required",
				},
				{ status: 401 },
			);
		}

		const { sessionId } = await context.params;
		const session = await getAccountVerificationSession(sessionId);

		if (!session) {
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Verification session not found",
				},
				{ status: 404 },
			);
		}

		if (session.userUuid.toLowerCase() !== userUuid.toLowerCase()) {
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Verification session does not belong to current user",
				},
				{ status: 403 },
			);
		}

		return NextResponse.json(
			{
				status: "success",
				result: true,
				verificationSession: {
					sessionId: session.sessionId,
					status: session.status,
					expiresAt: session.expiresAt,
					verifiedAt: session.verifiedAt,
					lastError: session.lastError,
				},
			},
			{ status: 200 },
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		return NextResponse.json(
			{
				status: "error",
				result: false,
				reason: message,
			},
			{ status: 500 },
		);
	}
}
