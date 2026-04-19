"use client";

import { useEffect } from "react";

const STANDALONE_HEIGHT_VAR = "--standalone-app-height";

const getIsStandalone = (): boolean => {
  if (typeof window === "undefined") return false;
  const mediaStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in window.navigator &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  return mediaStandalone || iosStandalone;
};

export function StandaloneViewportFix() {
  useEffect(() => {
    const root = document.documentElement;
    const isStandalone = getIsStandalone();

    if (!isStandalone) {
      root.dataset.displayMode = "browser";
      root.style.removeProperty(STANDALONE_HEIGHT_VAR);
      return;
    }

    root.dataset.displayMode = "standalone";

    const updateHeight = () => {
      const viewportHeight = Math.round(
        window.visualViewport?.height ?? window.innerHeight,
      );
      root.style.setProperty(STANDALONE_HEIGHT_VAR, `${viewportHeight}px`);
    };

    updateHeight();

    const onResize = () => updateHeight();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
