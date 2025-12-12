import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import {
  PiArrowSquareOut,
  PiFileText,
  PiGithubLogo,
  PiHeadset,
  PiQuestion,
  PiShieldCheck,
  PiX,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { TopBar } from "@/components/topbar";

interface MenuPageSkeletonProps {
  dictionary: Dictionary;
}

export function MenuPageSkeleton({ dictionary }: MenuPageSkeletonProps) {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.menu}
        startAdornment={<div className="size-10" />}
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiX className="size-4 text-gray-900" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="flex flex-col gap-8">
          {/* First Section Skeleton - could be Account or Language section */}
          <div>
            <div className="mb-4 flex">
              <div className="h-4.5 w-24 animate-pulse rounded bg-gray-100"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="min-h-14 bg-gray-50 rounded-2xl flex items-center p-4">
                <div className="mr-3 shrink-0 size-5 animate-pulse rounded-full bg-gray-200"></div>
                <div className="flex min-w-0 grow flex-col items-start gap-0.5">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div>
            <div className="mb-4 flex">
              <Typography
                variant="subtitle"
                level={3}
                className="text-gray-400"
              >
                {dictionary.pages.menu.sections.help.title}
              </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label={dictionary.pages.menu.sections.help.faq}
                startAdornment={<PiQuestion className="size-5 text-gray-400" />}
                noPointer
              />
              <CustomListItem
                label={dictionary.pages.menu.sections.help.support}
                startAdornment={<PiHeadset className="size-5 text-gray-400" />}
                endAdornment={
                  <PiArrowSquareOut className="size-4 text-gray-400" />
                }
                noPointer
              />
            </div>
          </div>

          {/* Source Code Section */}
          <div>
            <div className="mb-4 flex">
              <Typography
                variant="subtitle"
                level={3}
                className="text-gray-400"
              >
                {dictionary.pages.menu.sections.source_code.title}
              </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label="GitHub"
                startAdornment={
                  <PiGithubLogo className="size-5 text-gray-400" />
                }
                endAdornment={
                  <PiArrowSquareOut className="size-4 text-gray-400" />
                }
                noPointer
              />
            </div>
          </div>

          {/* Legal Section */}
          <div>
            <div className="mb-4 flex">
              <Typography
                variant="subtitle"
                level={3}
                className="text-gray-400"
              >
                {dictionary.pages.menu.sections.legal.title}
              </Typography>
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label={dictionary.pages.menu.sections.legal.terms}
                startAdornment={<PiFileText className="size-5 text-gray-400" />}
                noPointer
              />
              <CustomListItem
                label={dictionary.pages.menu.sections.legal.privacy}
                startAdornment={
                  <PiShieldCheck className="size-5 text-gray-400" />
                }
                noPointer
              />
            </div>
          </div>

          {/* Sign Out Section Skeleton - only shown for authenticated users */}
          <div>
            <div className="mb-4 flex">
              <div className="h-4.5 w-20 animate-pulse rounded bg-gray-100"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="min-h-14 bg-gray-50 rounded-2xl flex items-center p-4">
                <div className="mr-3 shrink-0 size-5 animate-pulse rounded-full bg-gray-200"></div>
                <div className="flex min-w-0 grow flex-col items-start gap-0.5">
                  <div className="h-5 w-28 animate-pulse rounded bg-gray-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
