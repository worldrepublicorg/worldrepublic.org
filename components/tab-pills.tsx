import { Pill } from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
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
	const router = useRouter();
	const path = basePath ?? `/${lang}`;
	return (
		<div className="flex overflow-x-auto scroll-smooth scroll-snap-type-x-mandatory px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
			{tabs.map((tab, index) => (
				<div
					key={tab.key}
					className={cn(
						"shrink-0 scroll-snap-align-start whitespace-nowrap",
						index === 0 && "pl-0",
						index === tabs.length - 1 && "pr-0",
					)}
				>
					<Pill
						checked={activeTab === tab.key}
						onClick={() => {
							if (onTabChange) {
								onTabChange(tab.key);
								return;
							}

							router.push(`${path}?tab=${tab.key}`);
						}}
					>
						{tab.label}
					</Pill>
				</div>
			))}
		</div>
	);
}
