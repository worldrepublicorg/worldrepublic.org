"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { PiArrowSquareOut } from "react-icons/pi";
import { CustomListItem } from "@/components/custom-list-item";

export interface LearnMoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Optional info text displayed in the drawer body */
  info?: string;
  /** Optional external link - renders like Menu page links (PiArrowSquareOut) without start icon */
  externalLink?: { url: string; label: string };
}

/**
 * A drawer similar to the "Select type" drawer on the Wallet page.
 * Displays "Learn more" (or custom title), optional info text, and/or
 * an external link styled like Menu page links (with arrow icon, no start icon).
 */
export function LearnMoreDrawer({
  open,
  onOpenChange,
  title,
  info,
  externalLink,
}: LearnMoreDrawerProps) {
  const hasContent = info || externalLink;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <Typography variant="heading" level={3}>
            {title}
          </Typography>
        </AlertDialogHeader>

        {info && (
          <Typography className="text-gray-500">{info}</Typography>
        )}

        {externalLink && (
          <AlertDialogFooter>
            <div className="flex flex-col gap-2 w-full">
              <a
                href={externalLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <CustomListItem
                  label={externalLink.label}
                  endAdornment={
                    <PiArrowSquareOut className="size-4 text-gray-400" />
                  }
                />
              </a>
            </div>
          </AlertDialogFooter>
        )}

        {!hasContent && (
          <AlertDialogDescription className="text-gray-500">
            —
          </AlertDialogDescription>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
