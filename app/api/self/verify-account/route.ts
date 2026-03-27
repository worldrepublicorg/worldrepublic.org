import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/connection";
import { userSelfVerifications, users } from "@/lib/db/schema";

const ACCOUNT_SELF_SCOPE = "world-republic-account";

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

export async function POST(req: Request) {
  try {
    const userUuid = await getAuthenticatedUserUuid();
    if (!userUuid) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Authentication required",
        },
        { status: 200 },
      );
    }

    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const verifier = createVerifier(origin);

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

    const result = await verifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData,
    );

    const { isValid } = result.isValidDetails;
    if (!isValid) {
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

    return NextResponse.json(
      {
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      },
      { status: 200 },
    );
  } catch (error) {
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
