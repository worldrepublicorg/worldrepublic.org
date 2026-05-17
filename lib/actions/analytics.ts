"use server";

import { sql } from "drizzle-orm";
import { db } from "@/lib/db/connection";
import { languageRequests } from "@/lib/db/schema";

export async function trackUnsupportedLanguage(requestedLocale: string) {
	try {
		// Use PostgreSQL upsert to increment counter atomically
		await db
			.insert(languageRequests)
			.values({
				locale: requestedLocale,
				count: 1,
				updatedAt: new Date(),
			})
			.onConflictDoUpdate({
				target: languageRequests.locale,
				set: {
					count: sql`${languageRequests.count} + 1`,
					updatedAt: new Date(),
				},
			});

		return { success: true };
	} catch (error) {
		console.error("Error tracking language request:", error);
		return { success: false, error: "Failed to track language request" };
	}
}
