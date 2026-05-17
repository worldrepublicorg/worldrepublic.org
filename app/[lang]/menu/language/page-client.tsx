"use client";

import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { PiCaretLeft, PiCheckCircleFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { TopBar } from "@/components/topbar";

interface Language {
	code: string;
	label: string;
}

interface LanguagePageClientProps {
	lang: string;
	dictionary: Dictionary;
	languages: Language[];
}

const PREFERRED_LANGUAGE_COOKIE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

async function setPreferredLanguageCookie(code: string) {
	if (typeof window === "undefined") return;
	if (!("cookieStore" in window) || !window.cookieStore) return;
	await window.cookieStore.set({
		name: "preferredLanguage",
		value: code,
		path: "/",
		expires: Date.now() + PREFERRED_LANGUAGE_COOKIE_MAX_AGE_MS,
	});
}

export default function LanguagePageClient({
	lang,
	dictionary,
	languages,
}: LanguagePageClientProps) {
	const router = useRouter();

	return (
		<div className="pb-safe flex flex-col">
			<TopBar
				title={dictionary.pages.menu.sections.account.language}
				startAdornment={
					<button
						type="button"
						onClick={() => router.back()}
						className="flex size-10 items-center justify-center rounded-full bg-gray-100"
					>
						<PiCaretLeft className="size-4 text-gray-900" />
					</button>
				}
			/>

			<div className="flex flex-col gap-2 p-6">
				{languages.map((language) => (
					<button
						type="button"
						key={language.code}
						onClick={async () => {
							const targetPath = `/${language.code}`;

							// Save language preference
							localStorage.setItem("preferredLanguage", language.code);
							await setPreferredLanguageCookie(language.code);

							// Navigate directly to the original page with new language
							router.push(targetPath);
						}}
						className="w-full"
					>
						<CustomListItem>
							<div className="flex h-8 w-full items-center justify-between">
								<Typography as="span" variant="subtitle" level={3}>
									{language.label}
								</Typography>
								{lang === language.code && (
									<PiCheckCircleFill className="size-4" />
								)}
							</div>
						</CustomListItem>
					</button>
				))}
			</div>
		</div>
	);
}
