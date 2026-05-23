import { NextResponse } from "next/server";
import {
	buildStubAggregateResponse,
	parseAggregateRequestBody,
} from "@/lib/dev/multipass/aggregate-stub";

export async function POST(request: Request) {
	const raw = await request.text();
	const parsed = parseAggregateRequestBody(raw);

	if ("error" in parsed) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	return NextResponse.json(buildStubAggregateResponse(parsed));
}
