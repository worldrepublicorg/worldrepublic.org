import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq, gt, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db/connection";
import { elections, parties, votes } from "@/lib/db/schema";

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

/**
 * Parse electionId and partyId from userContextData.
 * Self SDK sends userContextData as a hex-encoded string containing the userDefinedData JSON.
 */
function parseUserContextData(userContextData: unknown): {
  electionId: string | null;
  partyId: string | null;
} {
  let electionId: string | null = null;
  let partyId: string | null = null;

  try {
    if (typeof userContextData === "string") {
      // userContextData is hex-encoded - look for JSON pattern "7b22" which is '{"' in hex
      const jsonStartPattern = "7b22";
      const jsonStartIndex = userContextData
        .toLowerCase()
        .indexOf(jsonStartPattern);

      if (jsonStartIndex !== -1) {
        const hexJson = userContextData.slice(jsonStartIndex);
        const jsonString = Buffer.from(hexJson, "hex").toString("utf-8");
        console.log("[Self Verify] Decoded userDefinedData:", jsonString);

        const parsed = JSON.parse(jsonString);
        if (parsed?.electionId) {
          electionId = parsed.electionId;
          console.log("[Self Verify] Found electionId:", electionId);
        }
        if (parsed?.partyId) {
          partyId = parsed.partyId;
          console.log("[Self Verify] Found partyId:", partyId);
        }
      } else {
        // Try direct JSON parse as fallback
        const parsed = JSON.parse(userContextData);
        if (parsed?.electionId) electionId = parsed.electionId;
        if (parsed?.partyId) partyId = parsed.partyId;
      }
    }
  } catch (parseError) {
    console.log("[Self Verify] Failed to parse userContextData:", parseError);
  }

  return { electionId, partyId };
}

function isDuplicateVoteError(error: unknown): boolean {
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

  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    errorCode === "23505" ||
    errorMessage.includes("votes_election_nullifier_idx") ||
    errorMessage.includes("unique constraint") ||
    errorMessage.includes("duplicate key")
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

    // Parse electionId and partyId from userContextData
    const { electionId, partyId } = parseUserContextData(userContextData);

    if (!electionId) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Election ID not found in verification data",
        },
        { status: 200 },
      );
    }

    if (!partyId) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "Party ID not found in verification data",
        },
        { status: 200 },
      );
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
      .select({ id: elections.id, name: elections.name })
      .from(elections)
      .where(
        and(
          eq(elections.id, electionId),
          lte(elections.startsAt, now),
          gt(elections.endsAt, now),
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
        .where(eq(elections.id, electionId))
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
        electionId,
        partyId,
        selfNullifier: String(nullifier),
      });
    } catch (dbError) {
      if (isDuplicateVoteError(dbError)) {
        return NextResponse.json(
          {
            status: "error",
            result: false,
            reason: "You have already voted in this election",
          },
          { status: 200 },
        );
      }
      throw dbError;
    }

    return NextResponse.json(
      {
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
        electionName: activeElection[0].name,
        partyName: partyExists[0].id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Self verification error:", error);

    if (isDuplicateVoteError(error)) {
      return NextResponse.json(
        {
          status: "error",
          result: false,
          reason: "You have already voted in this election",
        },
        { status: 200 },
      );
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
