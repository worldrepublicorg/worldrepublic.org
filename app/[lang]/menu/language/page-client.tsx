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
            key={language.code}
            onClick={() => {
              const targetPath = `/${language.code}`;

              // Save language preference
              localStorage.setItem("preferredLanguage", language.code);
              document.cookie = `preferredLanguage=${
                language.code
              };path=/;max-age=${365 * 24 * 60 * 60}`;

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
