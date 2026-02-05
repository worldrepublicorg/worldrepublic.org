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
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiCheckCircleFill, PiClockCountdownFill } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const SelfVerificationDialog = dynamic(
  () =>
    import("@/components/identity/self-verification-dialog").then(
      (mod) => mod.SelfVerificationDialog,
    ),
  { ssr: false },
);

interface VoteButtonProps {
  fullWidth?: boolean;
  className?: string;
  label?: string;
  dictionary: Dictionary;
  partyId?: string;
  partyName?: string;
}

export function VoteButton({
  fullWidth = false,
  className,
  label,
  dictionary,
  partyId,
  partyName,
}: VoteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const buttonLabel = label || dictionary.common.vote;

  const [preVerificationDialogOpen, setPreVerificationDialogOpen] =
    useState(false);
  const [selfVerificationDialogOpen, setSelfVerificationDialogOpen] =
    useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  // Generate a random UUID for self-verification
  const [randomUserId, setRandomUserId] = useState<string | null>(null);

  // Generate random UUID on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !randomUserId) {
      const uuid = crypto.randomUUID();
      setRandomUserId(uuid);
    }
  }, [randomUserId]);

  const handlePreVerifyClick = () => {
    setPreVerificationDialogOpen(false);
    setSelfVerificationDialogOpen(true);
  };

  const handleVoteClick = () => {
    // Always go directly to pre-verification dialog, no auth check
    setPreVerificationDialogOpen(true);
  };

  // Check for vote success URL params (from mobile deeplink)
  useEffect(() => {
    const voteSuccess = searchParams.get("voteSuccess");
    const successPartyName = searchParams.get("partyName");

    if (voteSuccess === "true" && (successPartyName || partyName)) {
      setSuccessDialogOpen(true);
    }
  }, [searchParams, partyName]);

  const handleVerificationSuccess = async () => {
    setSuccessDialogOpen(true);
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    
    // If we have success params in URL, clear them
    if (searchParams.get("voteSuccess")) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("voteSuccess");
      newParams.delete("partyName");
      
      const newPath = newParams.toString() 
        ? `${pathname}?${newParams.toString()}` 
        : pathname;
        
      router.replace(newPath);
    } else {
      router.refresh();
    }
  };

  // Determine which party name to display (prop or URL param)
  const displayPartyName = searchParams.get("partyName") 
    ? decodeURIComponent(searchParams.get("partyName")!) 
    : partyName;

  return (
    <>
      <Button
        fullWidth={fullWidth}
        className={className}
        onClick={handleVoteClick}
      >
        {buttonLabel}
      </Button>

      {/* Pre-verification dialog */}
      <AlertDialog
        open={preVerificationDialogOpen}
        onOpenChange={setPreVerificationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiClockCountdownFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <Typography variant="heading" level={3}>
              {dictionary.pages.govern.vote.no_active_election}
            </Typography>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <Typography>
              {dictionary.pages.govern.vote.test_verification.description}
            </Typography>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={handlePreVerifyClick} className="w-full">
              {dictionary.pages.govern.vote.test_verification.button}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Self verification dialog */}
      <SelfVerificationDialog
        open={selfVerificationDialogOpen}
        onOpenChange={setSelfVerificationDialogOpen}
        onSuccess={handleVerificationSuccess}
        userId={randomUserId}
        dictionary={dictionary}
        partyId={partyId}
        partyName={partyName}
        returnPath={pathname}
      />

      {/* Vote success dialog */}
      <AlertDialog
        open={successDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleSuccessDialogClose();
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
              Vote cast successfully
            </Typography>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <Typography>
              {displayPartyName
                ? "Your vote for " + displayPartyName + " has been recorded."
                : "Your vote has been recorded."}
            </Typography>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button onClick={handleSuccessDialogClose} className="w-full">
              Done
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
