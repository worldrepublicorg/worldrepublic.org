import { AllIds, DefaultConfigStore, SelfBackendVerifier } from "@selfxyz/core";
import { and, eq, gt, isNull, lte } from "drizzle-orm";
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

    // Extract nullifier from verification result
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

    // Check if this is a voting request (has electionId and partyId in userDefinedData)
    const userDefinedData = result.userData?.userDefinedData;
    if (userDefinedData) {
      try {
        const voteData = JSON.parse(userDefinedData) as {
          electionId?: string;
          partyId?: string;
        };

        if (voteData.electionId && voteData.partyId) {
          // This is a voting request - process the vote
          const { electionId, partyId } = voteData;
          const now = new Date();

          // Verify election exists and is currently active (within time range)
          const [election] = await db
            .select()
            .from(elections)
            .where(
              and(
                eq(elections.id, electionId),
                lte(elections.startsAt, now),
                gt(elections.endsAt, now),
              ),
            )
            .limit(1);

          if (!election) {
            return NextResponse.json(
              {
                status: "error",
                result: false,
                reason: "Election not active",
              },
              { status: 200 },
            );
          }

          // Verify party exists and is not dissolved
          const [party] = await db
            .select()
            .from(parties)
            .where(and(eq(parties.id, partyId), isNull(parties.dissolvedAt)))
            .limit(1);

          if (!party) {
            return NextResponse.json(
              {
                status: "error",
                result: false,
                reason: "Invalid party",
              },
              { status: 200 },
            );
          }

          // Upsert vote (insert or update if already voted in this election)
          await db
            .insert(votes)
            .values({
              electionId,
              selfNullifier: nullifier,
              partyId,
            })
            .onConflictDoUpdate({
              target: [votes.electionId, votes.selfNullifier],
              set: { partyId, updatedAt: new Date() },
            });

          return NextResponse.json(
            {
              status: "success",
              result: true,
              voteRecorded: true,
              partyName: party.name,
            },
            { status: 200 },
          );
        }
      } catch {
        // userDefinedData is not valid JSON or doesn't contain vote data
        // Continue with normal verification response
      }
    }

    // Normal verification (no voting) - return success
    return NextResponse.json(
      {
        status: "success",
        result: true,
        credentialSubject: result.discloseOutput,
      },
      { status: 200 },
    );
  } catch (error) {
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
