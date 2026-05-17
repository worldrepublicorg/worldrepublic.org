"use client";

import { Button, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiWarningCircle } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { getDictionary } from "@/app/[lang]/dictionaries";

export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const { lang } = useParams<{ lang: string }>();
	const [dictionary, setDictionary] = useState<Dictionary | null>(null);

	useEffect(() => {
		// Log the error to an error reporting service
		console.error("Application error:", error);
	}, [error]);

	useEffect(() => {
		getDictionary(lang).then(setDictionary);
	}, [lang]);

	const t = dictionary?.pages.error;

	return (
		<div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
			<div className="flex w-full max-w-sm flex-col items-center gap-4">
				<div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
					<PiWarningCircle className="h-10 w-10 text-red-500" />
				</div>
				<Typography variant="heading" level={2}>
					{t?.title ?? "Something went wrong"}
				</Typography>
				<Typography variant="subtitle" level={2} className="text-gray-500">
					{t?.description ?? "An unexpected error occurred. Please try again."}
				</Typography>
				{error.digest && (
					<Typography variant="body" level={3} className="text-gray-400">
						{t?.error_id.replace("{digest}", error.digest) ??
							`Error ID: ${error.digest}`}
					</Typography>
				)}
				<Button onClick={reset} fullWidth className="mt-6!">
					{t?.try_again ?? "Try again"}
				</Button>
			</div>
		</div>
	);
}
