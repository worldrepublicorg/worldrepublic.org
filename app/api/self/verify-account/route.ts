import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { userSelfVerifications } from "@/lib/db/schema";
import {
	markAccountVerificationSessionFailed,
	markAccountVerificationSessionVerified,
	validateAccountVerificationSessionToken,
} from "@/lib/self/account-verification-session";

const ACCOUNT_SELF_SCOPE = "world-republic-account";
const ACCOUNT_SELF_ENDPOINT_ORIGIN = "https://www.worldrepublic.org";

function createVerifier(origin: string) {
	const endpoint = `${origin}/api/self/verify-account`;
	const mockPassport = false;
	const allowedIds = AllIds;
	const configStore = new DefaultConfigStore({
		ofac: true,
		excludedCountries: [],
	});
	const userIdentifierType = "uuid" as const;
	return new SelfBackendVerifier(
		ACCOUNT_SELF_SCOPE,
		endpoint,
		mockPassport,
		allowedIds,
		configStore,
		userIdentifierType,
	);
}

function parseAccountContextData(userContextData: unknown): {
	sessionToken: string | null;
} {
	if (typeof userContextData !== "string") {
		return { sessionToken: null };
	}

	try {
		const jsonStartPattern = "7b22";
		const jsonStartIndex = userContextData
			.toLowerCase()
			.indexOf(jsonStartPattern);
		if (jsonStartIndex !== -1) {
			const hexJson = userContextData.slice(jsonStartIndex);
			const jsonString = Buffer.from(hexJson, "hex").toString("utf-8");
			const parsed = JSON.parse(jsonString) as { sessionToken?: string };
			return { sessionToken: parsed.sessionToken ?? null };
		}

		const parsed = JSON.parse(userContextData) as { sessionToken?: string };
		return { sessionToken: parsed.sessionToken ?? null };
	} catch {
		return { sessionToken: null };
	}
}

export async function POST(req: Request) {
	let parsedSessionId: string | undefined;

	try {
		const verifier = createVerifier(ACCOUNT_SELF_ENDPOINT_ORIGIN);

		const { attestationId, proof, publicSignals, userContextData } =
			await req.json();

		if (!proof || !publicSignals || !attestationId || !userContextData) {
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason:
						"Proof, publicSignals, attestationId and userContextData are required",
				},
				{ status: 200 },
			);
		}

		const { sessionToken } = parseAccountContextData(userContextData);
		const sessionValidation = await validateAccountVerificationSessionToken(
			sessionToken ?? "",
		);
		if (!sessionValidation.ok) {
			if (sessionValidation.sessionId) {
				parsedSessionId = sessionValidation.sessionId;
				await markAccountVerificationSessionFailed(
					sessionValidation.sessionId,
					sessionValidation.reason,
				);
			}
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: sessionValidation.reason,
				},
				{ status: 200 },
			);
		}

		parsedSessionId = sessionValidation.payload.sessionId;
		const userUuid = sessionValidation.payload.userUuid;

		const result = await verifier.verify(
			attestationId,
			proof,
			publicSignals,
			userContextData,
		);

		const { isValid } = result.isValidDetails;
		if (!isValid) {
			await markAccountVerificationSessionFailed(
				parsedSessionId,
				"Verification failed",
			);
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Verification failed",
					details: result.isValidDetails,
				},
				{ status: 200 },
			);
		}

		const nullifier = result.discloseOutput?.nullifier;
		const verifiedUserIdentifier = result.userData?.userIdentifier;

		if (!nullifier || !verifiedUserIdentifier) {
			await markAccountVerificationSessionFailed(
				parsedSessionId,
				"Nullifier or user identifier missing in verification result",
			);
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Nullifier or user identifier missing in verification result",
				},
				{ status: 200 },
			);
		}

		if (verifiedUserIdentifier.toLowerCase() !== userUuid.toLowerCase()) {
			await markAccountVerificationSessionFailed(
				parsedSessionId,
				"Verified identity does not match authenticated account",
			);
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Verified identity does not match authenticated account",
				},
				{ status: 200 },
			);
		}

		const [existingNullifierBinding] = await db
			.select({ userId: userSelfVerifications.userId })
			.from(userSelfVerifications)
			.where(
				and(
					eq(userSelfVerifications.scope, ACCOUNT_SELF_SCOPE),
					eq(userSelfVerifications.selfNullifier, String(nullifier)),
				),
			)
			.limit(1);

		if (
			existingNullifierBinding &&
			existingNullifierBinding.userId.toLowerCase() !== userUuid.toLowerCase()
		) {
			await markAccountVerificationSessionFailed(
				parsedSessionId,
				"Self ID already linked to another account",
			);
			return NextResponse.json(
				{
					status: "error",
					result: false,
					reason: "Self ID already linked to another account",
				},
				{ status: 200 },
			);
		}

		const now = new Date();
		await db
			.insert(userSelfVerifications)
			.values({
				userId: userUuid,
				scope: ACCOUNT_SELF_SCOPE,
				selfNullifier: String(nullifier),
				selfVerifiedAt: now,
				createdAt: now,
				updatedAt: now,
			})
			.onConflictDoUpdate({
				target: userSelfVerifications.userId,
				set: {
					scope: ACCOUNT_SELF_SCOPE,
					selfNullifier: String(nullifier),
					selfVerifiedAt: now,
					updatedAt: now,
				},
			});

		await markAccountVerificationSessionVerified(parsedSessionId);

		return NextResponse.json(
			{
				status: "success",
				result: true,
				credentialSubject: result.discloseOutput,
			},
			{ status: 200 },
		);
	} catch (error) {
		if (parsedSessionId) {
			const message = error instanceof Error ? error.message : String(error);
			await markAccountVerificationSessionFailed(parsedSessionId, message);
		}
		const errorMessage = error instanceof Error ? error.message : String(error);
		return NextResponse.json(
			{
				status: "error",
				result: false,
				reason: errorMessage,
			},
			{ status: 200 },
		);
	}
}
