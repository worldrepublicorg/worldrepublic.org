import type { SelfApp } from "@selfxyz/qrcode";
import { useEffect, useState } from "react";

type SelfAppBuilderType = {
  withVersion: (v: number) => SelfAppBuilderType;
  withAppName: (name: string) => SelfAppBuilderType;
  withScope: (scope: string) => SelfAppBuilderType;
  withEndpoint?: (endpoint: string) => SelfAppBuilderType;
  withEndpointType?: (type: string) => SelfAppBuilderType;
  withLogoBase64?: (logo: string) => SelfAppBuilderType;
  withDeeplinkCallback: (cb: string) => SelfAppBuilderType;
  withUserId: (id: string) => SelfAppBuilderType;
  withUserIdType: (t: string) => SelfAppBuilderType;
  build: () => unknown;
};

const resolveCallbackUrl = (lang: string | undefined): string | null => {
  if (typeof window === "undefined") return null;
  const envCallback = process.env.NEXT_PUBLIC_SELF_CALLBACK;
  if (envCallback) {
    const locale = lang || "en";
    return envCallback.replace("{lang}", locale);
  }

  const hostname = window.location.hostname;
  const isLocal =
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";

  if (isLocal) {
    const publicBase = process.env.NEXT_PUBLIC_PUBLIC_BASE_URL; // e.g. https://your-tunnel-domain
    if (publicBase) return `${publicBase.replace(/\/$/, "")}/self/callback`;
    return null; // cannot produce a reachable callback from a phone without a tunnel
  }

  // Prefer locale-scoped callback to avoid redirection by i18n middleware
  const locale = lang || "en";
  return `${window.location.origin}/${locale}/self/callback`;
};

export function useSelfVerification(
  userId: string | null,
  lang: string | undefined,
  partyId?: string,
  electionId?: string,
) {
  const [universalLink, setUniversalLink] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [callbackReachable, setCallbackReachable] = useState(true);
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [SelfQRcodeWrapperCmp, setSelfQRcodeWrapperCmp] = useState<
    | ((props: {
        selfApp: SelfApp;
        onSuccess?: () => void;
        onError?: () => void;
      }) => React.ReactNode)
    | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!userId || typeof window === "undefined") {
        setIsLoading(false);
        return;
      }
      const callback = resolveCallbackUrl(lang);
      const nextTarget = `/${lang || "en"}/`;

      if (!callback) {
        setCallbackReachable(false);
        setUniversalLink(null);
        setIsLoading(false);
        return;
      }

      setCallbackReachable(true);

      try {
        const coreMod = (await import("@selfxyz/core")) as unknown as {
          getUniversalLink: (app: unknown) => string;
        };
        const qrcodeMod = (await import("@selfxyz/qrcode")) as unknown as {
          SelfAppBuilder: new () => SelfAppBuilderType;
          SelfQRcodeWrapper: (props: {
            selfApp: SelfApp;
            onSuccess?: () => void;
            onError?: () => void;
          }) => React.ReactNode;
        };
        const { getUniversalLink } = coreMod;
        const { SelfAppBuilder, SelfQRcodeWrapper } = qrcodeMod;
        const endpoint =
          process.env.NEXT_PUBLIC_SELF_ENDPOINT ||
          `${window.location.origin}/api/self/verify`;

        // Build userDefinedData object, only including defined values
        const userDefinedDataObj: Record<string, string> = {};
        if (electionId) userDefinedDataObj.electionId = electionId;
        if (partyId) userDefinedDataObj.partyId = partyId;

        type SelfAppCtor = new (
          config: Record<string, unknown>,
        ) => { build: () => unknown };
        const AppCtor = SelfAppBuilder as unknown as SelfAppCtor;
        const app = new AppCtor({
          version: 2,
          appName: "World Republic",
          scope: "world-republic",
          endpoint,
          endpointType: "staging_https",
          deeplinkCallback: `${callback}?userId=${encodeURIComponent(userId)}&next=${encodeURIComponent(nextTarget)}`,
          userId: userId,
          userIdType: "uuid",
          userDefinedData:
            Object.keys(userDefinedDataObj).length > 0
              ? JSON.stringify(userDefinedDataObj)
              : undefined,
          disclosures: {
            ofac: true,
          },
        }).build() as unknown as SelfApp;
        const link = getUniversalLink(app as unknown);
        setSelfApp(app);
        setSelfQRcodeWrapperCmp(() => SelfQRcodeWrapper);
        setUniversalLink(link);
        setIsLoading(false);
        return;
      } catch (err) {
        console.error("Self SDK import/build failed:", err);
        setUniversalLink(null);
        setIsLoading(false);
      }
    };
    init();
  }, [userId, lang, partyId, electionId]);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    setIsMobile(
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua),
    );
  }, []);

  return {
    selfApp,
    SelfQRcodeWrapperCmp,
    universalLink,
    callbackReachable,
    isLoading,
    isMobile,
  };
}
