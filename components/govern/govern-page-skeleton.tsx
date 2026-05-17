import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { TopBar } from "@/components/topbar";

/**
 * Govern page skeleton. Used by:
 * - Homepage route-level loading and Suspense fallback
 * - Govern page Suspense fallback
 * No title in TopBar to avoid text popping before data (same as Parties/Wallet).
 */
export function GovernPageSkeleton() {
	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar
				endAdornment={
					<Skeleton height={40} width={40} className="rounded-full" />
				}
			/>
			{/* Tab pills skeleton */}
			<div className="flex gap-1 overflow-x-auto px-6">
				<Skeleton height={36} width={80} className="rounded-full" />
				<Skeleton height={36} width={80} className="rounded-full" />
				<Skeleton height={36} width={80} className="rounded-full" />
			</div>
			<div className="flex grow flex-col overflow-y-auto p-6">
				{/* Hero card skeleton (ElectionHeroCard) */}
				<div className="mb-6 rounded-2xl border border-gray-200 p-6 shadow-sm! shadow-gray-100">
					<div className="flex items-center justify-between">
						<Skeleton height={26} width="70%" className="rounded-lg" />
						<Skeleton height={22} width={70} className="rounded-full" />
					</div>
					<div className="mt-4 flex flex-col gap-2">
						<Skeleton height={16} width="85%" className="rounded" />
						<Skeleton height={16} width="60%" className="rounded" />
					</div>
					<Skeleton height={40} width="100%" className="mt-5! rounded-full" />
				</div>

				{/* Section title skeleton */}
				<Skeleton height={23} width={140} className="mb-3! rounded-lg" />

				{/* Election card skeletons */}
				<div className="flex flex-col">
					{[1, 2, 3, 4, 5].map((i) => (
						<div
							key={i}
							className={`rounded-xl border border-gray-200 p-4 ${i < 5 ? "mb-4" : ""}`}
						>
							<div className="mb-2 flex items-center justify-between">
								<Skeleton height={24} width="65%" className="rounded-lg" />
								<Skeleton height={20} width={55} className="rounded-full" />
							</div>
							<div className="mt-3 flex flex-col gap-1.5">
								<Skeleton height={18} width="75%" className="rounded" />
								<Skeleton height={17} width="50%" className="rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
