import { NextResponse } from "next/server";

/** Multipass `pingServerHealth` expects `{base}/api/health` when `aggregateUrl` is `{base}/api/dev/multipass/proofs/aggregate`. */
export async function GET() {
	return NextResponse.json({
		status: "ok",
		service: "world-republic-multipass-dev",
	});
}
