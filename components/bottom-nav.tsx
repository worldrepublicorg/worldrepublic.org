"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaLandmark, FaUsers, FaWallet } from "react-icons/fa";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const pathname = usePathname();
  const lang = pathname.split("/")[1]; // Get language from URL
  const [pressedItem, setPressedItem] = useState<string | null>(null);

  const navItems = [
    { path: "/", label: "vote", icon: FaLandmark },
    { path: "/parties", label: "parties", icon: FaUsers },
    { path: "/wallet", label: "wallet", icon: FaWallet },
  ];

  const isActive = (path: string) => {
    const currentPath = pathname.split("/")[2] || "";
    const targetPath = path.slice(1) || "";
    // Root path is active when there's no second segment
    if (path === "/") {
      return currentPath === "";
    }
    return currentPath === targetPath;
  };

  return (
    <nav className="bg-gray-0 fixed bottom-0 left-1/2 w-full max-w-xl -translate-x-1/2!">
      <div className="flex h-14 items-center justify-around">
        {navItems.map(({ path, icon: Icon }) => {
          const href = `/${lang}${path}`;
          const isPressed = pressedItem === path;
          return (
            <Link
              key={path}
              href={href}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center space-y-[2px] touch-manipulation overflow-hidden h-14",
                isActive(path) ? "text-foreground" : "text-gray-400",
              )}
              tabIndex={0}
              onTouchStart={(e) => {
                // Stop propagation to prevent scroll handlers from capturing this touch
                e.stopPropagation();
                // Visual feedback only - let Link handle navigation
                if (!isPressed) {
                  setPressedItem(path);
                  setTimeout(() => setPressedItem(null), 400);
                }
              }}
              onTouchEnd={(e) => {
                // Stop propagation to ensure navigation works even during scrolling
                e.stopPropagation();
              }}
            >
              {/* Ripple effect */}
              {isPressed && (
                <span className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 animate-[ripple_1s_ease-out] rounded-full bg-gray-400/50" />
              )}
              <Icon
                className={cn(
                  "relative block transition-transform duration-200 group-active:scale-95 pointer-events-none",
                  Icon === FaUsers
                    ? "h-[26px] w-[26px]"
                    : Icon === FaLandmark
                      ? "h-6 w-6"
                      : "h-[22px] w-[22px]",
                )}
              />
            </Link>
          );
        })}
      </div>
      <div className="safe-area-spacer"></div>
    </nav>
  );
};

export default BottomNav;
