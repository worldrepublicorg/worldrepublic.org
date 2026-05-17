import { Button, Skeleton } from "@worldcoin/mini-apps-ui-kit-react";
import {
	PiCalendarBlank,
	PiCaretLeft,
	PiCoins,
	PiUserFocus,
} from "react-icons/pi";
import { TopBar } from "@/components/topbar";

/**
 * Election detail page skeleton. Used by:
 * - app/[lang]/govern/elections/loading.tsx (route-level loading)
 * - ElectionDetailPageClient when data is undefined (loading state)
 * No title in TopBar to avoid text popping before data.
 */
export function ElectionDetailPageSkeleton() {
	return (
		<div className="pb-safe flex min-h-dvh flex-col">
			<TopBar
				startAdornment={
					<div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
						<PiCaretLeft className="size-4 text-gray-900" />
					</div>
				}
			/>

			<div className="flex flex-1 flex-col p-6">
				<div className="mb-8 flex flex-wrap items-center justify-center gap-3">
					<Skeleton height={36} width={200} className="rounded-lg" />
					<Skeleton height={30} width={60} className="rounded-full" />
				</div>

				<div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
					<div className="border-b border-gray-200 bg-linear-to-r from-gray-50 to-gray-0 p-4">
						<Skeleton height={18} width={120} className="rounded-lg" />
					</div>
					<div className="flex flex-col gap-5.5 p-4 divide-y divide-gray-100">
						<div className="flex items-center gap-2">
							<PiCalendarBlank className="text-gray-400 shrink-0" size={14} />
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<Skeleton height={17} width="95%" className="rounded" />
								<Skeleton height={17} width="20%" className="rounded" />
							</div>
						</div>
						<div className="flex items-center gap-2">
							<PiCoins className="text-gray-400 shrink-0" size={14} />
							<Skeleton height={17} width={160} className="rounded" />
						</div>
					</div>
				</div>

				<Skeleton height={23} width={200} className="rounded-lg mb-3!" />

				<div className="mb-5 h-12.5">
					<div className="bg-gray-100 text-gray-900 h-14 inline-flex w-full shrink cursor-text items-center overflow-hidden border border-gray-100 rounded-[0.625rem] outline-none transition-all duration-300 ease-out px-4 gap-2">
						<div className="inline-flex items-center justify-center shrink-0 text-gray-500">
							<svg
								className="h-5 w-5"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<input
							type="text"
							disabled
							className="peer inline-block h-full grow w-full appearance-none bg-transparent border-none text-gray-900 placeholder:text-gray-500 focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed text-sm! leading-tight"
							readOnly
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-xl border border-gray-200">
					<div className="flex flex-col gap-6 p-4 divide-y divide-gray-100">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
							<div key={i} className="flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<Skeleton height={18} width="60%" className="mb-1 rounded" />
									<div className="flex items-center gap-1 mt-1">
										<PiUserFocus className="size-3.5 text-gray-400 shrink-0" />
										<Skeleton height={17} width={100} className="rounded" />
									</div>
								</div>
								<Button disabled size="sm">
									<Skeleton height={15} width={32} className="rounded-lg" />
								</Button>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
