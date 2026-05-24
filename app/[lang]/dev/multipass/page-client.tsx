"use client";

import {
	Button,
	Typography,
	useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useCallback, useEffect, useState } from "react";
import { TopBar } from "@/components/topbar";
import { copyToClipboard } from "@/lib/utils";

type SessionResponse = {
	id: string;
	verifyUrl: string;
};

type SessionStatus = {
	verified: boolean;
	nullifier?: string;
	verifiedAt?: number;
};

export default function MultipassDevPageClient() {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [session, setSession] = useState<SessionResponse | null>(null);
	const [status, setStatus] = useState<SessionStatus | null>(null);
	const [error, setError] = useState<string | null>(null);

	const createSession = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const resp = await fetch("/api/dev/multipass/sessions", {
				method: "POST",
			});
			const body = (await resp.json()) as SessionResponse & { error?: string };
			if (!resp.ok) {
				throw new Error(body.error || `Failed (${resp.status})`);
			}
			setSession({ id: body.id, verifyUrl: body.verifyUrl });
			setStatus({ verified: false });
		} catch (err) {
			setSession(null);
			setStatus(null);
			const message =
				err instanceof Error ? err.message : "Failed to create session";
			setError(message);
			toast.error({ title: message });
		} finally {
			setLoading(false);
		}
	}, [toast]);

	const copyVerifyUrl = useCallback(async () => {
		if (!session?.verifyUrl) return;
		await copyToClipboard(session.verifyUrl, toast, {
			success: "Verify URL copied",
			error: "Could not copy",
		});
	}, [session?.verifyUrl, toast]);

	useEffect(() => {
		if (!session?.id || status?.verified) {
			return;
		}

		let cancelled = false;

		const poll = async () => {
			try {
				const resp = await fetch(
					`/api/dev/multipass/sessions/${session.id}/status`,
				);
				if (!resp.ok || cancelled) {
					return;
				}
				const body = (await resp.json()) as SessionStatus;
				if (!cancelled) {
					setStatus(body);
				}
			} catch {
				// Keep polling; dev page is unauthenticated test harness only.
			}
		};

		void poll();
		const interval = setInterval(() => void poll(), 2000);

		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [session?.id, status?.verified]);

	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar title="Multipass dev" />

			<div className="flex flex-col gap-4 px-6 py-5">
				<Typography
					variant="body"
					level={3}
					className="text-[14px]! leading-normal! text-gray-600"
				>
					Create a test verification session. Paste the verify URL into
					multipass Scanner (Phase 1.6). For a physical phone, set{" "}
					<code className="text-gray-900">NEXTAUTH_URL</code> to a URL the
					device can reach (tunnel or deploy).
				</Typography>

				<Button
					type="button"
					onClick={createSession}
					disabled={loading}
					className="w-full"
				>
					{loading ? "Creating…" : "Create test session"}
				</Button>

				{error ? (
					<Typography
						variant="body"
						level={3}
						className="text-[14px]! text-red-600"
					>
						{error}
					</Typography>
				) : null}

				{session ? (
					<div className="flex flex-col gap-3 rounded-2xl bg-gray-100 p-4">
						<div>
							<Typography
								variant="subtitle"
								level={3}
								className="mb-1 text-xs font-medium text-gray-500"
							>
								Session ID
							</Typography>
							<Typography
								variant="body"
								level={3}
								className="break-all font-mono text-[13px]! text-gray-900"
							>
								{session.id}
							</Typography>
						</div>

						<div>
							<Typography
								variant="subtitle"
								level={3}
								className="mb-1 text-xs font-medium text-gray-500"
							>
								Verify URL
							</Typography>
							<Typography
								variant="body"
								level={3}
								className="break-all font-mono text-[13px]! text-gray-900"
							>
								{session.verifyUrl}
							</Typography>
						</div>

						<Button
							type="button"
							variant="secondary"
							onClick={copyVerifyUrl}
							className="w-full"
						>
							Copy verify URL
						</Button>

						<Typography
							variant="body"
							level={3}
							className="text-[13px]! text-gray-600"
						>
							Heavy inner proofs (e.g. RSA-4096 DSC) run on this dev server;
							witness bytes are sent over TLS and are not logged.
						</Typography>

						<div>
							<Typography
								variant="subtitle"
								level={3}
								className="mb-1 text-xs font-medium text-gray-500"
							>
								Status
							</Typography>
							<Typography
								variant="body"
								level={3}
								className={`text-[14px]! ${status?.verified ? "text-green-700" : "text-gray-600"}`}
							>
								{status?.verified
									? "Verified (stub aggregate received)"
									: "Waiting for multipass to sign…"}
							</Typography>
							{status?.verified && status.nullifier ? (
								<Typography
									variant="body"
									level={3}
									className="mt-2 break-all font-mono text-[12px]! text-gray-700"
								>
									{status.nullifier}
								</Typography>
							) : null}
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}
