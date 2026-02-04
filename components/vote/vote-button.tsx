"use client";

import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/app/[lang]/dictionaries";

interface VoteButtonProps {
  fullWidth?: boolean;
  className?: string;
  label?: string;
  dictionary: Dictionary;
  lang: string;
}

export function VoteButton({
  fullWidth = false,
  className,
  label,
  dictionary,
  lang,
}: VoteButtonProps) {
  const router = useRouter();
  const buttonLabel = label || dictionary.common.vote;

  const handleVoteClick = () => {
    router.push(`/${lang}/vote`);
  };

  return (
    <Button
      fullWidth={fullWidth}
      className={className}
      onClick={handleVoteClick}
    >
      {buttonLabel}
    </Button>
  );
}
