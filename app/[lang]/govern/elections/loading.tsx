"use client";

import { useLayoutEffect } from "react";
import { ElectionDetailPageSkeleton } from "@/components/govern/elections/election-detail-page-skeleton";

export default function ElectionDetailPageLoading() {
	useLayoutEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: "auto" });
	}, []);

	return <ElectionDetailPageSkeleton />;
}
