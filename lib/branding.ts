export type AppBranding = {
  appName: string;
  appDefaultTitle: string;
  appTitleTemplate: string;
  description: string;
  metadataBase: string;
};

const DEFAULT_BRANDING: AppBranding = {
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
  metadataBase: "https://www.raisedbyhumanity.org",
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
    normalizedHost === "raisedbyhumanity.org" ||
    normalizedHost === "www.raisedbyhumanity.org"
  ) {
    return RAISED_BY_HUMANITY_BRANDING;
  }

  return DEFAULT_BRANDING;
}
