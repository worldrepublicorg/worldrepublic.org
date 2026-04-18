import { Pill } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface TabPillsProps {
  activeTab: string;
  lang: string;
  tabs: Array<{ key: string; label: string }>;
  basePath?: string;
  onTabChange?: (tabKey: string) => void;
}

export function TabPills({
  activeTab,
  lang,
  tabs,
  basePath,
  onTabChange,
}: TabPillsProps) {
  const path = basePath ?? `/${lang}`;
  return (
    <div className="flex gap-1 overflow-x-auto scroll-smooth scroll-snap-type-x-mandatory px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab, index) => (
        <div
          key={tab.key}
          className={cn(
            "shrink-0 scroll-snap-align-start whitespace-nowrap",
            index === 0 && "pl-0",
            index === tabs.length - 1 && "pr-0",
          )}
        >
          {onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange(tab.key)}
              className="block"
            >
              <Pill checked={activeTab === tab.key}>{tab.label}</Pill>
            </button>
          ) : (
            <Link href={`${path}?tab=${tab.key}`} className="block">
              <Pill checked={activeTab === tab.key}>{tab.label}</Pill>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
