import { NextResponse } from "next/server";
import {
	buildStubAggregateResponse,
	getAggregateRequestMetrics,
	parseAggregateRequestBody,
} from "@/lib/dev/multipass/aggregate-stub";
import { markMultipassDevSessionVerified } from "@/lib/dev/multipass/sessions";

export async function POST(request: Request) {
	const raw = await request.text();
	const parsed = parseAggregateRequestBody(raw);

	if ("error" in parsed) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	// Phase 1.10 — observe real phone payloads before crypto verify (1.11+).
	const metrics = getAggregateRequestMetrics(raw, parsed);
	console.log("[multipass dev aggregate]", metrics);

	const response = buildStubAggregateResponse(parsed);
	if (metrics.sessionId) {
		markMultipassDevSessionVerified(metrics.sessionId, response.nullifier);
	}

	return NextResponse.json(response);
}
