"use client";

import { Button, DrawerClose } from "@worldcoin/mini-apps-ui-kit-react";
import { cn } from "@/lib/utils";

type CustomDrawerHeaderProps = {
  icon?: React.ReactNode;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

export function CustomDrawerHeader({
  icon,
  children,
  className,
  ...props
}: CustomDrawerHeaderProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-4 mb-2 w-full",
        className,
      )}
      {...props}
    >
      <div className="shrink-0">
        <DrawerClose asChild>
          <Button variant="tertiary" size="icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-4"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </Button>
        </DrawerClose>
      </div>
      <div className="flex flex-col gap-6 items-center justify-center">
        {children}
      </div>
      {icon ? (
        <div className="shrink-0">{icon}</div>
      ) : (
        <div className="shrink-0 size-10" />
      )}
    </div>
  );
}
