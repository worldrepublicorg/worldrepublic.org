import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import { PiCaretDown, PiCaretLeft } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";

interface FaqPageSkeletonProps {
  dictionary: Dictionary;
}

export function FaqPageSkeleton({ dictionary }: FaqPageSkeletonProps) {
  const faqs = Object.values(dictionary.pages.faq.items);

  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.faq.title}
        startAdornment={
          <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
            <PiCaretLeft className="size-4 text-gray-900" />
          </div>
        }
      />

      <div className="flex flex-col gap-2 p-6">
        {faqs.map((faq, index) => (
          <div key={index}>
            <div className="flex w-full items-center justify-between gap-4 py-5">
              <Typography
                as="span"
                variant="subtitle"
                level={3}
                className="text-[16px]! text-gray-900"
              >
                {faq.question}
              </Typography>
              <div className="flex size-6 items-center justify-center rounded-full bg-gray-100">
                <PiCaretDown className="size-4 text-gray-900" />
              </div>
            </div>
            {index < faqs.length - 1 && <div className="h-px bg-gray-100" />}
          </div>
        ))}
      </div>
    </div>
  );
}
