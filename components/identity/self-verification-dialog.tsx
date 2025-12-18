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
  PiGlobe,
  PiHeadset,
  PiUserCheckFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { useSelfVerification } from "@/hooks/use-self-verification";

interface SelfVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  userId: string | null;
  dictionary: Dictionary;
}

export function SelfVerificationDialog({
  open,
  onOpenChange,
  onSuccess,
  userId,
  dictionary,
}: SelfVerificationDialogProps) {
  const { lang } = useParams<{ lang: string }>();
  const {
    selfApp,
    SelfQRcodeWrapperCmp,
    universalLink,
    callbackReachable,
    isLoading,
    isMobile,
  } = useSelfVerification(userId, lang);

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
        href="https://map.self.xyz/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <CustomListItem
          startAdornment={<PiGlobe className="size-5 text-gray-400" />}
          label={dictionary.components.identity.self.supported_countries}
          endAdornment={<PiArrowSquareOut className="size-4 text-gray-400" />}
        />
      </a>

      <a
        href="https://t.me/selfxyz"
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
            {dictionary.components.identity.verification_warning.title}
          </Typography>
        </AlertDialogHeader>

        {!callbackReachable ? (
          <div className="mb-6 rounded-2xl bg-yellow-50 p-4 text-yellow-900">
            <Typography variant="subtitle" level={4} className="mb-2">
              Warning
            </Typography>
            <Typography>
              The verification callback URL is not reachable from your phone.
              Set NEXT_PUBLIC_SELF_CALLBACK to a public URL (or set
              NEXT_PUBLIC_PUBLIC_BASE_URL to a tunnel/preview domain).
            </Typography>
          </div>
        ) : isLoading ? (
          <div className="mb-6">
            <Typography>{dictionary.common.loading}</Typography>
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
                disabled={!universalLink}
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
              {SelfQRcodeWrapperCmp && selfApp ? (
                <div className="rounded-2xl p-4">
                  <SelfQRcodeWrapperCmp
                    selfApp={selfApp}
                    onSuccess={handleSuccess}
                  />
                </div>
              ) : universalLink ? (
                <div className="rounded-2xl p-4">
                  <img
                    alt="Self verification QR"
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
