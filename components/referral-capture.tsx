"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ReferralCapture() {
	const searchParams = useSearchParams();

	useEffect(() => {
		const ref = searchParams.get("ref");
		if (!ref) return;

		localStorage.setItem("pending_referral", ref);

		const url = new URL(window.location.href);
		url.searchParams.delete("ref");
		window.history.replaceState({}, "", url.toString());
	}, [searchParams]);

	return null;
}
