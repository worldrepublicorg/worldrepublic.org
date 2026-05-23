import { NextResponse } from "next/server";

/** Multipass `pingServerHealth`: `{aggregateUrl}/api/health` when `aggregateUrl` is the dev service base (`/api/dev/multipass`). */
export async function GET() {
	return NextResponse.json({
		status: "ok",
		service: "world-republic-multipass-dev",
	});
}
