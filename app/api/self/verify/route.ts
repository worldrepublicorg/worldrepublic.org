import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { votes } from "@/lib/db/schema";

// Hard-coded for testing - will be passed via userDefinedData later
const TEST_ELECTION_ID = "9341dcef-7c00-4f5b-9c4b-6e4b481fc607";
const TEST_PARTY_ID = "0691b005-175f-4975-a1c6-d424eea2f3c7";

function createVerifier(origin: string) {
  const scope = "world-republic";
  const endpoint = `${origin}/api/self/verify`;
  const mockPassport = false;
  const allowedIds = AllIds;
  const configStore = new DefaultConfigStore({
    ofac: true,
    excludedCountries: [],
  });
  const userIdentifierType = "uuid" as const;
  return new SelfBackendVerifier(
    scope,
    endpoint,
    mockPassport,
    allowedIds,
    configStore,
    userIdentifierType,
  );
}

export async function POST(req: Request) {
  try {
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

    // Extract nullifier from the verification result
    const nullifier = result.discloseOutput?.nullifier;
    if (!nullifier) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Nullifier not found in verification result",
        },
        { status: 200 },
      );
    }

    // Store the vote in the database
    try {
      await db.insert(votes).values({
        electionId: TEST_ELECTION_ID,
        partyId: TEST_PARTY_ID,
        selfNullifier: String(nullifier),
      });
    } catch (dbError) {
      // Check for unique constraint violation (duplicate vote)
      if (
        dbError &&
        typeof dbError === "object" &&
        "code" in dbError &&
        dbError.code === "23505"
      ) {
        return NextResponse.json(
          {
            status: "error",
            result: false,
            reason: "You have already voted in this election",
          },
          { status: 200 },
        );
      }
      // Re-throw other database errors
      throw dbError;
    }

    return NextResponse.json(
      {
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Self verification error:", error);
    return NextResponse.json(
      {
        status: "error",
        result: false,
        reason: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}
