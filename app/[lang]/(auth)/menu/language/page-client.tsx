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
              // Get the return URL (where user was before opening menu)
              const returnUrl = localStorage.getItem("menuReturnUrl");

              // Extract path without language prefix
              let targetPath = `/${language.code}/`; // default to root
              if (returnUrl) {
                const pathParts = returnUrl.split("/").filter(Boolean);
                if (pathParts.length > 1) {
                  // Has language prefix, replace it with new language
                  const pathWithoutLang = pathParts.slice(1).join("/");
                  targetPath = `/${language.code}/${pathWithoutLang}`;
                } else if (pathParts.length === 1) {
                  // Single part - check if it's a valid path
                  const commonPaths = ["", "parties", "wallet"];
                  if (commonPaths.includes(pathParts[0])) {
                    targetPath = `/${language.code}/${pathParts[0] || ""}`;
                  }
                } else if (pathParts.length === 0) {
                  // Empty returnUrl means root
                  targetPath = `/${language.code}/`;
                }
              }

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
