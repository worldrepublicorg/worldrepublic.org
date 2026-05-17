import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { users } from "@/lib/db/schema";
import { createAccountVerificationSession } from "@/lib/self/account-verification-session";

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

export async function POST() {
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

		const verificationSession =
			await createAccountVerificationSession(userUuid);

		return NextResponse.json(
			{
				status: "success",
				result: true,
				verificationSession: {
					sessionId: verificationSession.sessionId,
					token: verificationSession.token,
					expiresAt: verificationSession.expiresAt,
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
