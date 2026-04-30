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

export type SelfVerificationMode = "vote" | "account";

interface UseSelfVerificationOptions {
  mode?: SelfVerificationMode;
}

const ACCOUNT_VERIFICATION_ORIGIN = "https://www.worldrepublic.org";
const VOTE_VERIFICATION_ORIGIN = "https://www.worldrepublic.org";

const resolveCallbackUrl = (lang: string | undefined): string | null => {
  if (typeof window === "undefined") return null;

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
  options?: UseSelfVerificationOptions,
) {
  const [universalLink, setUniversalLink] = useState<string | null>(null);
  const [accountVerificationSessionId, setAccountVerificationSessionId] =
    useState<string | null>(null);
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
      const mode = options?.mode ?? "vote";
      const nextTarget = `/${lang || "en"}/menu/wallet`;

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
        let accountSessionToken: string | null = null;
        if (mode === "account") {
          const sessionRes = await fetch(
            "/api/self/account-verification-session",
            {
              method: "POST",
            },
          );
          const sessionJson = (await sessionRes.json()) as {
            result?: boolean;
            verificationSession?: {
              sessionId?: string;
              token?: string;
            };
            reason?: string;
          };

          if (!sessionRes.ok || !sessionJson?.result) {
            throw new Error(
              sessionJson?.reason ||
                "Failed to create account verification session",
            );
          }

          accountSessionToken = sessionJson.verificationSession?.token ?? null;
          const sessionId = sessionJson.verificationSession?.sessionId ?? null;
          if (!accountSessionToken || !sessionId) {
            throw new Error(
              "Account verification session payload is incomplete",
            );
          }
          setAccountVerificationSessionId(sessionId);
        } else {
          setAccountVerificationSessionId(null);
        }

        const endpoint =
          mode === "account"
            ? `${ACCOUNT_VERIFICATION_ORIGIN}/api/self/verify-account`
            : process.env.NEXT_PUBLIC_SELF_ENDPOINT ||
              `${VOTE_VERIFICATION_ORIGIN}/api/self/verify`;
        const scope =
          mode === "account" ? "world-republic-account" : "world-republic";
        const userIdType = "uuid";
        const deeplinkCallback =
          mode === "account"
            ? `${callback}?next=${encodeURIComponent(nextTarget)}`
            : callback;

        type SelfAppCtor = new (
          config: Record<string, unknown>,
        ) => { build: () => unknown };
        const AppCtor = SelfAppBuilder as unknown as SelfAppCtor;
        const app = new AppCtor({
          version: 2,
          appName: "World Republic",
          scope,
          endpoint,
          endpointType: "staging_https",
          deeplinkCallback,
          userId: userId,
          userIdType,
          userDefinedData:
            mode === "vote"
              ? electionId || partyId
                ? JSON.stringify({ electionId, partyId })
                : undefined
              : accountSessionToken
                ? JSON.stringify({ sessionToken: accountSessionToken })
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
        setAccountVerificationSessionId(null);
        setUniversalLink(null);
        setIsLoading(false);
      }
    };
    init();
  }, [userId, lang, partyId, electionId, options?.mode]);

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
    accountVerificationSessionId,
    callbackReachable,
    isLoading,
    isMobile,
  };
}
