import { Skeleton, Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiCaretLeft, PiPencilSimple, PiTrash } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";

interface AccountPageSkeletonProps {
  dictionary: Dictionary;
}

export function AccountPageSkeleton({ dictionary }: AccountPageSkeletonProps) {
  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.menu.sections.account.account_info}
        startAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiCaretLeft className="size-4 text-gray-900" />
          </div>
        }
      />
      <div className="flex flex-col gap-8 p-6">
        {/* Account Section */}
        <div>
          <div className="mb-4 flex">
            <Typography variant="subtitle" level={3} className="text-gray-400">
              {dictionary.pages.wallet.sections.account}
            </Typography>
          </div>
          <div className="flex flex-col gap-2">
            {/* Username */}
            <div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
              <div className="flex min-w-0 grow flex-col items-start gap-0.5">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="w-full grow truncate text-left"
                >
                  {dictionary.pages.wallet.username.label}
                </Typography>
                <Skeleton height={16} width={120} />
              </div>
              <div className="ml-4 shrink-0">
                <PiPencilSimple className="size-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div>
          <div className="mb-4 flex">
            <Typography variant="subtitle" level={3} className="text-gray-400">
              {dictionary.pages.wallet.sections.danger_zone}
            </Typography>
          </div>
          <div className="flex flex-col gap-2">
            <div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
              <div className="flex min-w-0 grow flex-col items-start gap-0.5">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="w-full grow truncate text-left"
                >
                  {dictionary.common.delete_account}
                </Typography>
                <Typography
                  level={4}
                  className="w-full grow truncate text-left text-gray-500"
                >
                  {dictionary.pages.wallet.sections.delete_account.description}
                </Typography>
              </div>
              <div className="ml-4 shrink-0">
                <PiTrash className="size-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
