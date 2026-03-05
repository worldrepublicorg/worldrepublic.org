import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@worldcoin/mini-apps-ui-kit-react/styles.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@worldcoin/mini-apps-ui-kit-react";
import { Suspense } from "react";
import BottomNav from "@/components/bottom-nav";
import { ReferralCapture } from "@/components/referral-capture";
import { cn } from "@/lib/utils";

const rubik = localFont({
  src: "../public/fonts/Rubik.woff2",
  variable: "--font-rubik",
  display: "swap",
});

const twkLausanne = localFont({
  src: [
    {
      path: "../public/fonts/TWKLausanne-350.woff2",
      weight: "400",
    },
    {
      path: "../public/fonts/TWKLausanne-500.woff2",
      weight: "500",
    },
    {
      path: "../public/fonts/TWKLausanne-600.woff2",
      weight: "600",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

const APP_NAME = "World Republic";
const APP_DEFAULT_TITLE = "World Republic";
const APP_TITLE_TEMPLATE = "%s - World Republic";
const APP_DESCRIPTION = "The new OS of humanity";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.worldrepublic.org"),
  applicationName: APP_NAME,
  title: {
    default: APP_DEFAULT_TITLE,
    template: APP_TITLE_TEMPLATE,
  },
  description: APP_DESCRIPTION,
  icons: {
    icon: "/icons/android-chrome-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    url: "https://www.worldrepublic.org",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
    images: [
      {
        url: "/icons/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "World Republic",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: {
      default: APP_DEFAULT_TITLE,
      template: APP_TITLE_TEMPLATE,
    },
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html dir="ltr">
      <head>
        <meta name="format-detection" content="telephone=no" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
      </head>
      <body
        className={cn(
          rubik.variable,
          twkLausanne.variable,
          "relative min-h-screen antialiased",
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(100%_60%_at_50%_0%,rgba(0,85,99,0.08),transparent)]"
        />
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-white shadow-sm ring-1 ring-gray-100">
          {children}
          <Toaster />
        </div>
        <Suspense>
          <ReferralCapture />
        </Suspense>
        <BottomNav />
        <SpeedInsights />
      </body>
    </html>
  );
}
