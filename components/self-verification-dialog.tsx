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
import Image from "next/image";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PiArrowSquareOut,
  PiHeadset,
  PiIdentificationCardFill,
  PiInfo,
  PiLockKeyFill,
  PiMaskHappyFill,
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
  const [step, setStep] = useState<"primer" | "verification">("primer");
  const { lang } = useParams<{ lang: string }>();
  const {
    selfApp,
    SelfQRcodeWrapperCmp,
    universalLink,
    accountVerificationSessionId,
    callbackReachable,
    isLoading,
    isMobile,
  } = useSelfVerification(userId, lang, partyId, electionId, { mode });
  const completionHandledRef = useRef(false);
  const primerOpen = open && step === "primer";
  const verificationOpen = open && step === "verification";

  const closeDialog = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const openVerificationStep = useCallback(() => {
    setStep("verification");
  }, []);

  const handleSuccess = useCallback(async () => {
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    if (onSuccess) {
      await onSuccess();
    }
    closeDialog();
  }, [onSuccess, closeDialog]);

  useEffect(() => {
    if (!open) {
      completionHandledRef.current = false;
      setStep("primer");
    }
  }, [open]);

  useEffect(() => {
    if (
      !verificationOpen ||
      mode !== "account" ||
      !accountVerificationSessionId ||
      !userId
    ) {
      return;
    }

    let isCancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/self/account-verification-session/${accountVerificationSessionId}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok || isCancelled) return;
        const data = (await res.json()) as {
          result?: boolean;
          verificationSession?: { status?: string };
        };
        if (data?.result && data.verificationSession?.status === "verified") {
          await handleSuccess();
        }
      } catch {
        // Best-effort polling; user can still complete on same-device callback.
      }
    };

    const interval = window.setInterval(poll, 2000);
    void poll();

    return () => {
      isCancelled = true;
      window.clearInterval(interval);
    };
  }, [
    verificationOpen,
    mode,
    accountVerificationSessionId,
    userId,
    handleSuccess,
  ]);

  const handleContinue = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank", "noopener,noreferrer");
  };

  const supportLinks = (
    <div className="mb-4 flex flex-col gap-2">
      <a
        href="https://self.xyz/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <CustomListItem
          startAdornment={<PiInfo className="size-5 text-gray-400" />}
          label={dictionary.components.identity.self.learn_about_self}
          endAdornment={<PiArrowSquareOut className="size-4 text-gray-400" />}
        />
      </a>

      <a
        href="https://wiki.worldrepublic.org/quickstart/get-verified"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <CustomListItem
          startAdornment={<PiRocketLaunch className="size-5 text-gray-400" />}
          label={dictionary.components.identity.self.verification_guide}
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
          label={dictionary.components.identity.self.support_telegram}
          endAdornment={<PiArrowSquareOut className="size-4 text-gray-400" />}
        />
      </a>
    </div>
  );

  return (
    <>
      <AlertDialog
        open={primerOpen}
        onOpenChange={(nextOpen) => !nextOpen && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiIdentificationCardFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <Typography variant="heading" level={3}>
              {dictionary.components.identity.self.primer.title}
            </Typography>
          </AlertDialogHeader>

          <AlertDialogDescription className="mb-4">
            {dictionary.components.identity.self.primer.description}
          </AlertDialogDescription>

          <div className="mb-8 w-full">
            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <PiLockKeyFill className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <Typography variant="body" level={3} className="mt-[3px]">
                  {
                    dictionary.components.identity.self.primer
                      .feature_device_data
                  }
                </Typography>
              </li>
              <li className="flex items-center">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <PiMaskHappyFill className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <Typography variant="body" level={3} className="mt-[3px]">
                  {
                    dictionary.components.identity.self.primer
                      .feature_invisible_identity
                  }
                </Typography>
              </li>
              <li className="flex items-center">
                <div className="mr-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  <PiUserCheckFill className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <Typography variant="body" level={3} className="mt-[3px]">
                  {
                    dictionary.components.identity.self.primer
                      .feature_prevents_fakes
                  }
                </Typography>
              </li>
            </ul>
          </div>

          <AlertDialogFooter>
            <Button onClick={openVerificationStep} className="w-full">
              {dictionary.common.continue}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={verificationOpen}
        onOpenChange={(nextOpen) => !nextOpen && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiUserCheckFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <Typography variant="heading" level={3}>
              {dictionary.components.identity.verification_warning.title}
            </Typography>
          </AlertDialogHeader>

          {!callbackReachable ? (
            <div className="mb-6 rounded-2xl bg-yellow-50 p-4 text-yellow-900">
              <Typography variant="subtitle" level={4} className="mb-2">
                {dictionary.components.identity.self.callback_warning}
              </Typography>
              <Typography>
                {
                  dictionary.components.identity.self
                    .callback_warning_description
                }
              </Typography>
            </div>
          ) : isMobile ? (
            <>
              <AlertDialogDescription className="mb-4">
                {dictionary.components.identity.self.mobile_dialog_description}
              </AlertDialogDescription>

              {supportLinks}

              <AlertDialogFooter>
                <Button
                  onClick={handleContinue}
                  disabled={isLoading || !universalLink}
                  className="w-full"
                >
                  {dictionary.common.continue}
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogDescription className="mb-4">
                {dictionary.components.identity.self.dialog_description}
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
                    <Image
                      alt={dictionary.components.identity.self.qr_alt}
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
    </>
  );
}
