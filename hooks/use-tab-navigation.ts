"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSwipeable } from "react-swipeable";

/**
 * Generic hook to manage tab navigation with URL sync and swipe gestures
 * @param tabs - Array of tab values
 * @param onEdgeSwipe - Optional callback when swiping at edge (can't navigate further in this tab set)
 * @param shouldHandleSwipe - Optional function to determine if a swipe should be handled (returns false to ignore)
 * @returns Object containing activeTab, updateTab function, and swipe handlers
 */
export const useTabNavigation = <T extends string>(
  tabs: readonly T[],
  onEdgeSwipe?: (direction: "left" | "right") => void,
  shouldHandleSwipe?: (eventData: {
    event?: Event | React.SyntheticEvent;
  }) => boolean,
) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize activeTab from URL or default to first tab
  const [activeTab, setActiveTab] = useState<T>(() => {
    const tabFromUrl = searchParams.get("tab") as T;
    return tabs.includes(tabFromUrl) ? tabFromUrl : tabs[0];
  });

  // Track swipe progress (0 = no swipe, positive = swiping right, negative = swiping left)
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Track if we're in a horizontal swipe to prevent scroll
  const isHorizontalSwipeRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Reset swipe offset on mount/refresh
  useEffect(() => {
    setSwipeOffset(0);
    isHorizontalSwipeRef.current = false;
  }, []);

  // Update URL when tab changes
  const updateTab = (newTab: T) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", newTab);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // Swipe handlers for tab navigation
  const handlers = useSwipeable({
    onTouchStartOrOnMouseDown: (eventData) => {
      // Track initial touch position to determine swipe direction early
      if (eventData.event) {
        const touch =
          (eventData.event as TouchEvent).touches?.[0] ||
          (eventData.event as MouseEvent);
        if (touch) {
          touchStartRef.current = {
            x: "clientX" in touch ? touch.clientX : 0,
            y: "clientY" in touch ? touch.clientY : 0,
          };
        }
      }
    },
    onSwiping: (eventData) => {
      // Check if we should handle this swipe
      if (shouldHandleSwipe && !shouldHandleSwipe(eventData)) {
        return;
      }

      // Only handle primarily horizontal swipes (ignore vertical scrolling)
      const absDeltaX = Math.abs(eventData.deltaX);
      const absDeltaY = Math.abs(eventData.deltaY);

      // Determine if this is a horizontal swipe early
      // If vertical movement is greater than horizontal, it's a scroll - ignore
      if (absDeltaY > absDeltaX) {
        isHorizontalSwipeRef.current = false;
        setSwipeOffset(0);
        return;
      }

      // If we have significant horizontal movement, mark as horizontal swipe
      if (absDeltaX >= 10) {
        isHorizontalSwipeRef.current = true;
      }

      // Require minimum horizontal movement to avoid accidental triggers
      if (absDeltaX < 10) {
        setSwipeOffset(0);
        return;
      }

      const currentIndex = tabs.indexOf(activeTab);
      const deltaX = eventData.deltaX;
      const containerElement = eventData.event?.currentTarget as HTMLElement;
      const containerWidth =
        containerElement?.clientWidth ||
        (typeof window !== "undefined" ? window.innerWidth : 0);

      if (containerWidth === 0) return; // Can't calculate without width

      // Calculate offset as percentage of container width
      // Clamp to prevent over-swiping
      const maxOffset = 1; // 100% of container width
      const offset = Math.max(
        -maxOffset,
        Math.min(maxOffset, deltaX / containerWidth),
      );

      // Only allow swiping if we're not at the edge
      if (deltaX < 0 && currentIndex < tabs.length - 1) {
        // Swiping left (to next tab)
        setSwipeOffset(offset);
      } else if (deltaX > 0 && currentIndex > 0) {
        // Swiping right (to previous tab)
        setSwipeOffset(offset);
      } else {
        // At edge, reset offset
        setSwipeOffset(0);
      }
    },
    onSwipedLeft: (eventData) => {
      // Check if we should handle this swipe
      if (shouldHandleSwipe && !shouldHandleSwipe(eventData)) {
        isHorizontalSwipeRef.current = false;
        return;
      }

      // Only handle if it was primarily horizontal
      const absDeltaX = Math.abs(eventData.deltaX);
      const absDeltaY = Math.abs(eventData.deltaY);
      if (absDeltaY > absDeltaX || absDeltaX < 10) {
        isHorizontalSwipeRef.current = false;
        setSwipeOffset(0);
        return;
      }

      // Stop propagation to prevent parent handlers from firing
      if (eventData.event) {
        eventData.event.stopPropagation();
      }
      setSwipeOffset(0); // Reset offset
      isHorizontalSwipeRef.current = false;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        updateTab(tabs[currentIndex + 1]);
      } else {
        // At rightmost tab, bubble up to parent
        onEdgeSwipe?.("left");
      }
    },
    onSwipedRight: (eventData) => {
      // Check if we should handle this swipe
      if (shouldHandleSwipe && !shouldHandleSwipe(eventData)) {
        isHorizontalSwipeRef.current = false;
        return;
      }

      // Only handle if it was primarily horizontal
      const absDeltaX = Math.abs(eventData.deltaX);
      const absDeltaY = Math.abs(eventData.deltaY);
      if (absDeltaY > absDeltaX || absDeltaX < 10) {
        isHorizontalSwipeRef.current = false;
        setSwipeOffset(0);
        return;
      }

      // Stop propagation to prevent parent handlers from firing
      if (eventData.event) {
        eventData.event.stopPropagation();
      }
      setSwipeOffset(0); // Reset offset
      isHorizontalSwipeRef.current = false;
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        updateTab(tabs[currentIndex - 1]);
      } else {
        // At leftmost tab, bubble up to parent
        onEdgeSwipe?.("right");
      }
    },
    onSwiped: () => {
      // Reset on any swipe end
      isHorizontalSwipeRef.current = false;
      setSwipeOffset(0);
    },
    preventScrollOnSwipe: false, // Allow normal scrolling, we'll handle it manually
    trackMouse: true,
    // Add threshold to require minimum horizontal movement
    delta: 10, // Minimum 10px movement to trigger
  });

  return {
    activeTab,
    updateTab,
    handlers,
    tabs,
    swipeOffset, // Export the swipe offset
  };
};
