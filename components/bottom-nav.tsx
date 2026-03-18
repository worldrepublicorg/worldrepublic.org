"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FaBars, FaLandmark, FaUsers } from "react-icons/fa";
import { cn } from "@/lib/utils";

const BottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split("/")[1]; // Get language from URL
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  const touchStartRef = useRef<{
    x: number;
    y: number;
    time: number;
    path: string;
  } | null>(null);

  const navItems = [
    { path: "/", label: "vote", icon: FaLandmark },
    { path: "/parties", label: "parties", icon: FaUsers },
    { path: "/menu", label: "menu", icon: FaBars },
  ];

  const isActive = (path: string) => {
    const sectionSegment = pathname.split("/")[2] || "";
    // Treat the whole /[lang]/vote section (and its children) as the first tab
    const currentSection = sectionSegment === "vote" ? "" : sectionSegment;
    const targetPath = path.slice(1) || "";
    // Root path is active when we're on the root section or the vote section
    if (path === "/") {
      return currentSection === "";
    }
    return currentSection === targetPath;
  };

  return (
    <nav className="bg-gray-0 fixed bottom-0 left-1/2 z-40 w-full max-w-xl -translate-x-1/2!">
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

                const touch = e.touches[0];
                touchStartRef.current = {
                  x: touch.clientX,
                  y: touch.clientY,
                  time: Date.now(),
                  path,
                };

                // Visual feedback
                if (!isPressed) {
                  setPressedItem(path);
                  setTimeout(() => setPressedItem(null), 400);
                }
              }}
              onTouchEnd={(e) => {
                // Stop propagation to ensure navigation works even during scrolling
                e.stopPropagation();

                if (
                  !touchStartRef.current ||
                  touchStartRef.current.path !== path
                ) {
                  return;
                }

                const touch = e.changedTouches[0];
                const start = touchStartRef.current;
                const deltaX = Math.abs(touch.clientX - start.x);
                const deltaY = Math.abs(touch.clientY - start.y);
                const deltaTime = Date.now() - start.time;

                // Check if it's a tap (minimal movement, short duration)
                const isTap = deltaX < 10 && deltaY < 10 && deltaTime < 300;

                if (isTap) {
                  // Manually trigger navigation to ensure it works even during scrolling
                  e.preventDefault();
                  router.push(href);
                }

                touchStartRef.current = null;
              }}
              onClick={(e) => {
                // Fallback for desktop/mouse clicks
                // This ensures navigation works even if touch events were intercepted
                if (touchStartRef.current?.path === path) {
                  // Touch event already handled navigation
                  touchStartRef.current = null;
                  return;
                }
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
