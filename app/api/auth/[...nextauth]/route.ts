import { type NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";

export async function GET(req: NextRequest) {
	const handler = handlers.GET;
	if (handler) {
		return handler(req);
	}
	return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: NextRequest) {
	const handler = handlers.POST;
	if (handler) {
		return handler(req);
	}
	return NextResponse.json({ error: "Not found" }, { status: 404 });
}
