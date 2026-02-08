import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import {
  PiArrowSquareOut,
  PiBookOpenText,
  PiFileText,
  PiGithubLogo,
  PiGlobe,
  PiLifebuoy,
  PiRocketLaunch,
  PiShieldCheck,
  PiSignIn,
  PiX,
} from "react-icons/pi";
import { CustomListItem } from "@/components/custom-list-item";
import { TopBar } from "@/components/topbar";

export function MenuPageSkeleton() {
  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        startAdornment={<div className="size-10" />}
        endAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiX className="size-4 text-gray-900" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="flex flex-col gap-8">
          {/* Account Section */}
          <div>
            <div className="mb-4 flex">
              <Skeleton height={18} width={40} className="rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              {/* Sign in / Account info skeleton */}
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={
                  <Skeleton height={20} width={20} className="rounded-full" />
                }
                noPointer
              />
              {/* Language item */}
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={<PiGlobe className="size-5 text-gray-400" />}
                noPointer
              />
            </div>
          </div>

          {/* Help Section */}
          <div>
            <div className="mb-4 flex">
              <Skeleton height={18} width={40} className="rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={
                  <PiRocketLaunch className="size-5 text-gray-400" />
                }
                endAdornment={
                  <PiArrowSquareOut className="size-4 text-gray-400" />
                }
                noPointer
              />
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={
                  <PiBookOpenText className="size-5 text-gray-400" />
                }
                endAdornment={
                  <PiArrowSquareOut className="size-4 text-gray-400" />
                }
                noPointer
              />
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={<PiLifebuoy className="size-5 text-gray-400" />}
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
              <Skeleton height={18} width={40} className="rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
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
              <Skeleton height={18} width={40} className="rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={<PiFileText className="size-5 text-gray-400" />}
                noPointer
              />
              <CustomListItem
                label={
                  <Skeleton height={18} width={40} className="rounded-lg" />
                }
                startAdornment={
                  <PiShieldCheck className="size-5 text-gray-400" />
                }
                noPointer
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
