import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { TopBar } from "@/components/topbar";

/**
 * Shared account page skeleton. Used by:
 * - app/[lang]/menu/account/loading.tsx (route-level loading)
 * - AccountPageClient when showSkeleton
 * No title in TopBar to avoid text popping before data (same as Wallet/Menu).
 */
export function AccountPageSkeleton() {
	return (
		<div className="pb-safe flex flex-col">
			<TopBar
				startAdornment={
					<Skeleton height={40} width={40} className="rounded-full" />
				}
			/>
			<div className="flex flex-col gap-8 p-6">
				{/* Account Section */}
				<div>
					<div className="mb-4 flex">
						<Skeleton height={18} width={40} className="rounded-lg" />
					</div>
					<div className="flex flex-col gap-2">
						<div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
							<div className="flex min-w-0 grow flex-col items-start gap-0.5">
								<Skeleton height={18} width={40} className="rounded-lg" />
								<Skeleton height={17} width={40} className="rounded-lg" />
							</div>
						</div>

						<div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
							<div className="flex min-w-0 grow flex-col items-start gap-0.5">
								<Skeleton height={18} width={40} className="rounded-lg" />
								<Skeleton height={17} width={40} className="rounded-lg" />
							</div>
							<div className="ml-4 shrink-0">
								<Skeleton height={16} width={16} className="rounded-full" />
							</div>
						</div>
					</div>
				</div>

				{/* Verification Section */}
				<div>
					<div className="mb-4 mt-1.5 flex">
						<Skeleton height={18} width={72} className="rounded-lg" />
					</div>
					<div className="flex flex-col gap-2">
						<div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
							<div className="flex min-w-0 grow flex-col items-start gap-0.5">
								<Skeleton height={18} width={48} className="rounded-lg" />
								<Skeleton height={17} width={96} className="rounded-lg" />
							</div>
						</div>
					</div>
				</div>

				{/* Danger Zone Section */}
				<div>
					<div className="mb-4 flex">
						<Skeleton height={18} width={40} className="rounded-lg" />
					</div>
					<div className="flex flex-col gap-2">
						<div className="min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center">
							<div className="flex min-w-0 grow flex-col items-start gap-0.5">
								<Skeleton height={18} width={40} className="rounded-lg" />
								<Skeleton height={17} width={40} className="rounded-lg" />
							</div>
							<div className="ml-4 shrink-0">
								<Skeleton height={16} width={16} className="rounded-full" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
