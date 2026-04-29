"use client";

import { Typography, useToast } from "@worldcoin/mini-apps-ui-kit-react";
import { PiInfo } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { copyToClipboard } from "@/lib/utils";

interface WddImportInfoBannerProps {
  dictionary: Dictionary;
}

export default function WddImportInfoBanner({
  dictionary,
}: WddImportInfoBannerProps) {
  const { toast } = useToast();

  const handleCopyContractAddress = async () => {
    await copyToClipboard("0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b", toast, {
      success: dictionary.toasts.copied,
      error: dictionary.toasts.generic_error,
    });
  };

  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gray-50 p-4 text-center">
      <div className="flex items-start gap-3">
        <PiInfo className="size-5 shrink-0 text-gray-500" />
        <Typography
          variant="body"
          level={4}
          className="min-w-0 text-left text-[14px] font-medium text-gray-500 whitespace-normal wrap-break-words"
        >
          {dictionary.components.wdd_import_info.message_prefix}
          <button
            type="button"
            onClick={handleCopyContractAddress}
            className="inline p-0 m-0 border-0 bg-transparent align-baseline font-inherit text-inherit underline whitespace-normal break-all"
          >
            {dictionary.components.wdd_import_info.contract_address}
          </button>
        </Typography>
      </div>
    </div>
  );
}
