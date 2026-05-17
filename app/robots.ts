import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
		},
		// Uncomment and set this when you have a sitemap:
		// sitemap: "https://your-domain.com/sitemap.xml",
	};
}
