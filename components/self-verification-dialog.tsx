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
import { useParams } from "next/navigation";
import {
  PiArrowSquareOut,
  PiHeadset,
  PiRocketLaunch,
  PiUserCheckFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import {
  type SelfVerificationMode,
  useSelfVerification,
} from "@/hooks/use-self-verification";

interface SelfVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string | null;
  dictionary: Dictionary;
  partyId?: string;
  electionId?: string;
  mode?: SelfVerificationMode;
}

export function SelfVerificationDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  dictionary,
  partyId,
  electionId,
  mode = "vote",
}: SelfVerificationDialogProps) {
  const { lang } = useParams<{ lang: string }>();
  const isAccountMode = mode === "account";
  const {
    selfApp,
    SelfQRcodeWrapperCmp,
    universalLink,
    callbackReachable,
    isLoading,
    isMobile,
  } = useSelfVerification(userId, lang, partyId, electionId, { mode });

  const copy = {
    title: isAccountMode
      ? "Verify with Self"
      : dictionary.components.identity.self.confirm_eligibility,
    warningTitle: isAccountMode
      ? "Warning"
      : dictionary.components.identity.self.callback_warning,
    warningBody: isAccountMode
      ? "The verification callback URL is not reachable from your phone. Set NEXT_PUBLIC_SELF_CALLBACK to a public URL (or set NEXT_PUBLIC_PUBLIC_BASE_URL to a tunnel/preview domain)."
      : dictionary.components.identity.self.callback_warning_description,
    mobileDescription: isAccountMode
      ? "You will be redirected to the Self app to verify your account."
      : dictionary.components.identity.self.mobile_dialog_description,
    desktopDescription: isAccountMode
      ? "Scan this QR code to complete account verification with Self."
      : dictionary.components.identity.self.dialog_description,
    verificationGuide: isAccountMode
      ? "Verification guide"
      : dictionary.components.identity.self.verification_guide,
    support: isAccountMode
      ? "Self Support"
      : dictionary.components.identity.self.support_telegram,
    continue: isAccountMode ? "Continue" : dictionary.common.continue,
    qrAlt: isAccountMode
      ? "Self verification QR"
      : dictionary.components.identity.self.qr_alt,
  };

  const handleSuccess = async () => {
    if (onSuccess) {
      await onSuccess();
    }
    onOpenChange(false);
  };

  const handleContinue = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank", "noopener,noreferrer");
  };

  const supportLinks = (
    <div className="mb-4 flex flex-col gap-2">
      <a
        href="https://wiki.worldrepublic.org/quickstart/get-verified"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <CustomListItem
          startAdornment={<PiRocketLaunch className="size-5 text-gray-400" />}
          label={copy.verificationGuide}
          endAdornment={<PiArrowSquareOut className="size-4 text-gray-400" />}
        />
      </a>

      <a
        href="https://discord.gg/selfxyz"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <CustomListItem
          startAdornment={<PiHeadset className="size-5 text-gray-400" />}
          label={copy.support}
          endAdornment={<PiArrowSquareOut className="size-4 text-gray-400" />}
        />
      </a>
    </div>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <PiUserCheckFill className="h-[30px] w-[30px] text-gray-400" />
            </div>
          }
        >
          <Typography variant="heading" level={3}>
            {copy.title}
          </Typography>
        </AlertDialogHeader>

        {!callbackReachable ? (
          <div className="mb-6 rounded-2xl bg-yellow-50 p-4 text-yellow-900">
            <Typography variant="subtitle" level={4} className="mb-2">
              {copy.warningTitle}
            </Typography>
            <Typography>{copy.warningBody}</Typography>
          </div>
        ) : isMobile ? (
          <>
            <AlertDialogDescription className="mb-4">
              {copy.mobileDescription}
            </AlertDialogDescription>

            {supportLinks}

            <AlertDialogFooter>
              <Button
                onClick={handleContinue}
                disabled={isLoading || !universalLink}
                className="w-full"
              >
                {copy.continue}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogDescription className="mb-4">
              {copy.desktopDescription}
            </AlertDialogDescription>

            <div className="mb-4 flex w-full justify-center">
              {isLoading ? (
                <div className="h-[300px] w-[300px] p-4 animate-pulse rounded-2xl bg-gray-100" />
              ) : SelfQRcodeWrapperCmp && selfApp ? (
                <div className="rounded-2xl p-4">
                  <SelfQRcodeWrapperCmp
                    selfApp={selfApp}
                    onSuccess={handleSuccess}
                  />
                </div>
              ) : universalLink ? (
                <div className="rounded-2xl p-4">
                  <img
                    alt={copy.qrAlt}
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      universalLink,
                    )}`}
                    width={200}
                    height={200}
                  />
                </div>
              ) : null}
            </div>

            {supportLinks}
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
