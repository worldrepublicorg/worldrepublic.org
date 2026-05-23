import { NextResponse } from "next/server";
import { buildDevProofRequestPayload } from "@/lib/dev/multipass/proof-request";
import {
	getMultipassDevOrigin,
	getMultipassDevSession,
} from "@/lib/dev/multipass/sessions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
	const { id } = await context.params;
	const session = getMultipassDevSession(id);

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	const origin = getMultipassDevOrigin(request);
	return NextResponse.json(buildDevProofRequestPayload(origin, session));
}
