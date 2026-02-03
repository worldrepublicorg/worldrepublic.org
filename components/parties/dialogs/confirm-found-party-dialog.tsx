"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { PiPlusCircleFill, PiWarning } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import type { Party } from "@/lib/types/parties";
import { cn } from "@/lib/utils";

interface ConfirmFoundPartyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userParty: Party | null;
  onConfirm: () => void;
  isProcessing?: boolean;
  dictionary: Dictionary;
}

export function ConfirmFoundPartyDialog({
  open,
  onOpenChange,
  userParty,
  onConfirm,
  isProcessing = false,
  dictionary,
}: ConfirmFoundPartyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <PiPlusCircleFill className="h-[30px] w-[30px] text-gray-400" />
            </div>
          }
        >
          <Typography variant="heading" level={3}>
            {dictionary.pages.govern.parties.dialogs.found_party}
          </Typography>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <div>
            <p>{dictionary.pages.govern.parties.dialogs.about_to_found}</p>
            {userParty && (
              <div className="mt-4 flex h-full w-full items-center justify-center rounded-2xl bg-red-50 p-4 text-center">
                <div className="flex items-start gap-3">
                  <PiWarning className="size-5 shrink-0 text-red-500" />
                  <Typography
                    variant="body"
                    level={4}
                    className="text-left text-[14px] font-medium text-red-500"
                  >
                    {dictionary.pages.govern.parties.dialogs.leader_warning_found.replace(
                      "{partyName}",
                      userParty.name,
                    )}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <Button
            variant="primary"
            fullWidth
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isProcessing}
            className={cn(userParty && "bg-error-600")}
          >
            {isProcessing
              ? dictionary.pages.govern.parties.dialogs.founding
              : dictionary.common.confirm}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
