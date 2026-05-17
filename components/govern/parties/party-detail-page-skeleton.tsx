import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { TopBar } from "@/components/topbar";

/**
 * Party detail page skeleton. Used by:
 * - app/[lang]/govern/parties/[id]/loading.tsx (route-level loading)
 * - PartyDetailPageClient when party is null (loading state)
 * No title in TopBar to avoid text popping before data (same as other pages).
 */
export function PartyDetailPageSkeleton() {
	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar
				startAdornment={
					<Skeleton height={40} width={40} className="rounded-full" />
				}
				endAdornment={
					<Skeleton height={40} width={40} className="rounded-full" />
				}
			/>

			<div className="flex flex-1 flex-col p-6">
				{/* Hero section */}
				<div className="mt-6 mb-10 flex flex-col items-center">
					<Skeleton height={36} width="75%" className="rounded-lg" />
				</div>

				{/* Description card */}
				<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
					<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
						<Skeleton height={24} width={120} className="rounded-lg" />
					</div>
					<div className="p-4">
						<Skeleton height={80} width="100%" className="rounded" />
					</div>
				</div>

				{/* Party Info card */}
				<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
					<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
						<Skeleton height={24} width={80} className="rounded-lg" />
					</div>
					<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
						<div className="flex items-center justify-between gap-6">
							<Skeleton height={17} width="33%" className="rounded" />
							<Skeleton height={17} width="33%" className="rounded" />
						</div>
						<div className="flex items-center justify-between gap-6">
							<Skeleton height={17} width="25%" className="rounded" />
							<Skeleton height={17} width="50%" className="rounded" />
						</div>
					</div>
				</div>

				{/* Vote button skeleton */}
				<div className="mt-auto">
					<Skeleton height={56} width="100%" className="mt-6! rounded-full" />
				</div>
			</div>
		</div>
	);
}
