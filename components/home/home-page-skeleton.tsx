import { Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import { TopBar } from "@/components/topbar";

/**
 * Home page skeleton. Used by:
 * - Homepage route-level loading and Suspense fallback
 * - Home page client loading state before wallet/auth data resolves
 * No title in TopBar to avoid text popping before data (same as Govern/Wallet).
 */
export function HomePageSkeleton() {
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
				<Skeleton height={36} width={80} className="rounded-full" />
			</div>

			<main className="flex grow items-center justify-center">
				<div className="flex w-full flex-col items-center p-6">
					{/* Icon/illustration placeholder */}
					<div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
						<Skeleton height={40} width={40} className="rounded-full" />
					</div>
					{/* Headline, helper text, amount and CTA placeholders */}
					<div className="flex w-full flex-col items-center gap-4">
						<Skeleton height={36} width={180} className="rounded-lg" />
						<Skeleton height={21} width={180} className="rounded-lg" />
						<Skeleton
							height={56}
							width={240}
							className="mt-5! mb-1! rounded-lg"
						/>
						<Skeleton height={56} width="100%" className="mt-6! rounded-full" />
					</div>
				</div>
			</main>
		</div>
	);
}
