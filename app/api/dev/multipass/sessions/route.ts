import { NextResponse } from "next/server";
import {
	createMultipassDevSession,
	getMultipassDevOrigin,
	multipassVerifyUrl,
} from "@/lib/dev/multipass/sessions";

export async function POST(request: Request) {
	const session = await createMultipassDevSession();
	const origin = getMultipassDevOrigin(request);
	const verifyUrl = multipassVerifyUrl(origin, session.id);

	return NextResponse.json({
		id: session.id,
		verifyUrl,
	});
}
