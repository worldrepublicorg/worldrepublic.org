type AppBranding = {
	appName: string;
	appDefaultTitle: string;
	appTitleTemplate: string;
	description: string;
	metadataBase: string;
};

/**
 * Primary public host for user-generated links (referral, party share).
 * Always this origin, including when the app is opened on worldrepublic.org.
 */
export const CANONICAL_SHARE_ORIGIN = "https://www.raisedbyhumanity.org";

const WORLD_REPUBLIC_BRANDING: AppBranding = {
	appName: "World Republic",
	appDefaultTitle: "World Republic",
	appTitleTemplate: "%s - World Republic",
	description: "The new OS of humanity",
	metadataBase: "https://www.worldrepublic.org",
};

const RAISED_BY_HUMANITY_BRANDING: AppBranding = {
	appName: "Raised by Humanity",
	appDefaultTitle: "Raised by Humanity",
	appTitleTemplate: "%s - Raised by Humanity",
	description: "AI governance by a world parliament",
	metadataBase: CANONICAL_SHARE_ORIGIN,
};

function normalizeHost(host: string | null | undefined): string {
	if (!host) {
		return "";
	}

	const firstHost = host.split(",")[0]?.trim() ?? "";
	const withoutProtocol = firstHost.replace(/^https?:\/\//, "");
	const withoutPath = withoutProtocol.split("/")[0] ?? "";
	const withoutPort = withoutPath.replace(/:\d+$/, "");

	return withoutPort.toLowerCase();
}

export function getBrandingForHost(
	host: string | null | undefined,
): AppBranding {
	const normalizedHost = normalizeHost(host);

	if (
		normalizedHost === "worldrepublic.org" ||
		normalizedHost === "www.worldrepublic.org"
	) {
		return WORLD_REPUBLIC_BRANDING;
	}

	return RAISED_BY_HUMANITY_BRANDING;
}
