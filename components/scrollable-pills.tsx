"use client";

import { Pill } from "@worldcoin/mini-apps-ui-kit-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PillItem {
  key: string;
  label: string;
  checked: boolean;
  onClick: () => void;
}

interface ScrollablePillsProps {
  items: PillItem[];
  activeKey: string;
}

export default function ScrollablePills({
  items,
  activeKey,
}: ScrollablePillsProps) {
  const pillContainerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Auto-scroll to active pill when tab changes
  useEffect(() => {
    const activePillRef = pillRefs.current[activeKey];
    if (activePillRef && pillContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        activePillRef.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      });
    }
  }, [activeKey]);

  return (
    <div
      ref={pillContainerRef}
      className="flex gap-1 overflow-x-auto scroll-smooth scroll-snap-type-x-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item, index) => (
        <div
          key={item.key}
          ref={(el) => {
            pillRefs.current[item.key] = el;
          }}
          className={cn(
            "shrink-0 scroll-snap-align-start whitespace-nowrap",
            index === 0 && "pl-6",
            index === items.length - 1 && "pr-6",
          )}
        >
          <Pill checked={item.checked} onClick={item.onClick}>
            {item.label}
          </Pill>
        </div>
      ))}
    </div>
  );
}
