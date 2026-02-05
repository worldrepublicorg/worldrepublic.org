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
import { PiCheckCircleFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

interface VoteSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  partyName?: string;
  dictionary: Dictionary;
}

export function VoteSuccessDialog({
  open,
  onOpenChange,
  onClose,
  partyName,
  dictionary,
}: VoteSuccessDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
              <PiCheckCircleFill className="h-[30px] w-[30px] text-green-600" />
            </div>
          }
        >
          <Typography variant="heading" level={3}>
            {dictionary.pages.govern.vote.success?.title ??
              "Vote cast successfully"}
          </Typography>
        </AlertDialogHeader>
        <AlertDialogDescription>
          <Typography>
            {partyName
              ? (
                  dictionary.pages.govern.vote.success?.description ??
                  "Your vote for {partyName} has been recorded."
                ).replace("{partyName}", partyName)
              : (dictionary.pages.govern.vote.success?.description_generic ??
                "Your vote has been recorded.")}
          </Typography>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <Button onClick={onClose} className="w-full">
            {dictionary.pages.govern.vote.success?.button ??
              dictionary.common.done ??
              "Done"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
