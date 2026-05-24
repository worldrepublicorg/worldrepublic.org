import { NextResponse } from "next/server";
import {
	parseProveInnerBody,
	validateProveInnerBody,
} from "@/lib/dev/multipass/prove-inner-request";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
	const raw = await request.text();
	const parsed = parseProveInnerBody(raw);

	if ("error" in parsed) {
		return NextResponse.json({ error: parsed.error }, { status: 400 });
	}

	const validated = validateProveInnerBody(parsed);
	if ("error" in validated) {
		return NextResponse.json({ error: validated.error }, { status: 400 });
	}

	const { runProveInner } = await import("@/lib/dev/multipass/prove-inner");
	const result = await runProveInner(validated);
	if ("error" in result) {
		return NextResponse.json(
			{ error: result.error },
			{ status: result.status },
		);
	}

	return NextResponse.json(result);
}
