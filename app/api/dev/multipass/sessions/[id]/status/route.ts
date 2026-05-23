import { NextResponse } from "next/server";
import { getMultipassDevSessionStatus } from "@/lib/dev/multipass/sessions";

type RouteContext = { params: Promise<{ id: string }> };

/** Phase 1.14 — poll verification outcome for dev test page / web flows. */
export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params;
	const status = getMultipassDevSessionStatus(id);

	if (!status) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	return NextResponse.json(status);
}
