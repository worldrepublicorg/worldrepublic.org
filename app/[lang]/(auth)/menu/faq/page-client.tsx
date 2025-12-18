"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PiCaretDown, PiCaretLeft, PiCaretUp } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { TopBar } from "@/components/topbar";
import { Button, Typography } from "@/components/ui";
import { cn } from "@/lib/utils";

interface FaqPageClientProps {
  lang: string;
  dictionary: Dictionary;
}

export default function FaqPageClient({ dictionary }: FaqPageClientProps) {
  const router = useRouter();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Convert dictionary items to array while preserving IDs
  const faqs = Object.entries(dictionary.pages.faq.items).map(([id, item]) => ({
    id,
    ...item,
  }));

  useEffect(() => {
    const questionId = searchParams.get("q");
    if (questionId) {
      setOpenAccordion(questionId);
    }
  }, [searchParams]);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.faq.title}
        startAdornment={
          <Button onClick={() => router.back()} variant="tertiary" size="icon">
            <PiCaretLeft className="size-4 text-gray-900" />
          </Button>
        }
      />

      <div className="flex flex-col gap-2 p-6">
        {faqs.map((faq, index) => (
          <div key={faq.id}>
            <Button
              className="w-full justify-between gap-4 py-5! text-left focus:outline-none bg-transparent hover:bg-transparent"
              onClick={() => toggleAccordion(faq.id)}
              variant="tertiary"
              fullWidth
            >
              <Typography
                as="span"
                variant="subtitle"
                level={3}
                className="text-[16px]! text-gray-900"
              >
                {faq.question}
              </Typography>
              <div className="flex size-6 items-center justify-center rounded-full bg-gray-100">
                {openAccordion === faq.id ? (
                  <PiCaretUp className="size-4 text-gray-900 transition-transform duration-200" />
                ) : (
                  <PiCaretDown className="size-4 text-gray-900 transition-transform duration-200" />
                )}
              </div>
            </Button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-200 ease-in-out",
                openAccordion === faq.id ? "max-h-96" : "max-h-0",
              )}
            >
              <div className="pb-4">
                <Typography
                  as="p"
                  variant="body"
                  level={3}
                  className="text-[16px]! leading-normal! text-gray-500"
                >
                  <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                </Typography>
              </div>
            </div>

            {index < faqs.length - 1 && <div className="h-px bg-gray-100" />}
          </div>
        ))}
      </div>
    </div>
  );
}
