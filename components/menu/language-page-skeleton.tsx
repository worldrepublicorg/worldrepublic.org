import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiCaretLeft, PiCheckCircleFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { TopBar } from "@/components/topbar";

interface LanguagePageSkeletonProps {
  dictionary: Dictionary;
  languages: Array<{ code: string; label: string }>;
  currentLang: string;
}

export function LanguagePageSkeleton({
  dictionary,
  languages,
  currentLang,
}: LanguagePageSkeletonProps) {
  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.menu.sections.account.language}
        startAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiCaretLeft className="size-4 text-gray-900" />
          </div>
        }
      />

      <div className="flex flex-col gap-2 p-6">
        {languages.map((language) => (
          <CustomListItem key={language.code} noPointer>
            <div className="flex h-8 w-full items-center justify-between">
              <Typography as="span" variant="subtitle" level={3}>
                {language.label}
              </Typography>
              {currentLang === language.code && (
                <PiCheckCircleFill className="size-4" />
              )}
            </div>
          </CustomListItem>
        ))}
      </div>
    </div>
  );
}
