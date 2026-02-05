import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq, gt, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { elections, parties, votes } from "@/lib/db/schema";

// Hard-coded for testing - will be passed via userDefinedData later
const TEST_ELECTION_ID = "9341dcef-7c00-4f5b-9c4b-6e4b481fc607";
const TEST_PARTY_ID = "8d33df6d-3d33-4857-8c8c-cca20b734429";

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

    // Extract partyId from userContextData (userDefinedData from frontend)
    // Self SDK sends userContextData as a hex-encoded string containing the userDefinedData
    let partyId = TEST_PARTY_ID;
    
    try {
      if (typeof userContextData === "string") {
        // userContextData is hex-encoded - look for JSON pattern "7b22" which is '{"' in hex
        const jsonStartPattern = "7b22"; // '{"' in hex
        const jsonStartIndex = userContextData.toLowerCase().indexOf(jsonStartPattern);
        
        if (jsonStartIndex !== -1) {
          // Extract hex from the JSON start to the end
          const hexJson = userContextData.slice(jsonStartIndex);
          
          // Decode hex to UTF-8 string
          const jsonString = Buffer.from(hexJson, "hex").toString("utf-8");
          console.log("[Self Verify] Decoded userDefinedData:", jsonString);
          
          // Parse the JSON
          const parsed = JSON.parse(jsonString);
          if (parsed?.partyId) {
            partyId = parsed.partyId;
            console.log("[Self Verify] Found partyId:", partyId);
          }
        } else {
          // Try direct JSON parse as fallback
          const parsed = JSON.parse(userContextData);
          if (parsed?.partyId) {
            partyId = parsed.partyId;
          }
        }
      }
    } catch (parseError) {
      // If parsing fails, use the fallback TEST_PARTY_ID
      console.log("[Self Verify] Using fallback TEST_PARTY_ID - parsing failed:", parseError);
    }

    // Validate that the party exists
    const partyExists = await db
      .select({ id: parties.id })
      .from(parties)
      .where(eq(parties.id, partyId))
      .limit(1);

    if (partyExists.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Party not found",
        },
        { status: 200 },
      );
    }

    // Verify the election exists and is currently active
    const now = new Date();
    const activeElection = await db
      .select({ id: elections.id })
      .from(elections)
      .where(
        and(
          eq(elections.id, TEST_ELECTION_ID),
          lte(elections.startsAt, now), // Election has started
          gt(elections.endsAt, now), // Election has not ended
        ),
      )
      .limit(1);

    if (activeElection.length === 0) {
      // Check if election exists but is not active
      const electionExists = await db
        .select({
          id: elections.id,
          startsAt: elections.startsAt,
          endsAt: elections.endsAt,
        })
        .from(elections)
        .where(eq(elections.id, TEST_ELECTION_ID))
        .limit(1);

      if (electionExists.length === 0) {
        return NextResponse.json(
          {
            status: "error",
            result: false,
            reason: "Election not found",
          },
          { status: 200 },
        );
      }

      const election = electionExists[0];
      if (election.startsAt > now) {
        return NextResponse.json(
          {
            status: "error",
            result: false,
            reason: "Election has not started yet",
          },
          { status: 200 },
        );
      }

      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Election has ended",
        },
        { status: 200 },
      );
    }

    // Store the vote in the database
    try {
      await db.insert(votes).values({
        electionId: TEST_ELECTION_ID,
        partyId: partyId,
        selfNullifier: String(nullifier),
      });
    } catch (dbError) {
      // Check for unique constraint violation (duplicate vote)
      // Error code might be nested in different properties depending on driver
      const errorCode =
        (dbError &&
          typeof dbError === "object" &&
          ("code" in dbError
            ? dbError.code
            : "cause" in dbError &&
                dbError.cause &&
                typeof dbError.cause === "object" &&
                "code" in dbError.cause
              ? dbError.cause.code
              : null)) ||
        null;

      const errorMessage =
        dbError instanceof Error ? dbError.message : String(dbError);

      // Check for duplicate vote by error code or message content
      if (
        errorCode === "23505" ||
        errorMessage.includes("votes_election_nullifier_idx") ||
        errorMessage.includes("unique constraint") ||
        errorMessage.includes("duplicate key")
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

    // Check for unique constraint violation in outer catch (in case inner catch didn't catch it)
    const errorCode =
      (error &&
        typeof error === "object" &&
        ("code" in error
          ? error.code
          : "cause" in error &&
              error.cause &&
              typeof error.cause === "object" &&
              "code" in error.cause
            ? error.cause.code
            : null)) ||
      null;

    if (errorCode === "23505") {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "You have already voted in this election",
        },
        { status: 200 },
      );
    }

    // Check if error message contains unique constraint hint
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorCode === "23505" ||
      errorMessage.includes("votes_election_nullifier_idx") ||
      errorMessage.includes("unique constraint") ||
      errorMessage.includes("duplicate key") ||
      errorMessage.includes("already exists")
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
