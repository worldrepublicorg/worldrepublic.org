"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeWalletBalance, type StreamData } from "@/lib/streams";

/** Stable empty list so callers can use `streams ?? EMPTY_STREAMS` without new [] each render */
export const EMPTY_STREAMS: StreamData[] = [];

/**
 * Matches wallet page: live total = stream accrual (non-BI) + stored wallet balance,
 * recomputed every second when there are streams; otherwise the server snapshot.
 */
export function useLiveWalletBalance(
	streams: StreamData[] | null | undefined,
	storedWalletBalance: number,
	serverBalance: number | null,
): number | null {
	const userStreams = streams ?? EMPTY_STREAMS;
	const [liveBalance, setLiveBalance] = useState<number | null>(null);
	const streamsRef = useRef(userStreams);
	streamsRef.current = userStreams;

	const computeBalance = useCallback(() => {
		const s = streamsRef.current;
		if (s.length > 0) {
			return computeWalletBalance(s, Date.now()) + storedWalletBalance;
		}
		return null;
	}, [storedWalletBalance]);

	useEffect(() => {
		if (userStreams.length === 0) {
			setLiveBalance(null);
			return;
		}
		setLiveBalance(computeBalance());
		const interval = setInterval(() => {
			setLiveBalance(computeBalance());
		}, 1000);
		return () => clearInterval(interval);
	}, [userStreams, computeBalance]);

	return liveBalance ?? serverBalance;
}
