"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "@worldcoin/mini-apps-ui-kit-react";
import BottomNav from "@/components/bottom-nav";

export default function LangLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider refetchOnWindowFocus={true}>
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-white shadow-sm ring-1 ring-gray-100">
        {children}
        <Toaster />
      </div>
      <BottomNav />
    </SessionProvider>
  );
}

