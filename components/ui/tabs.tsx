"use client";

import { Slot } from "@radix-ui/react-slot";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Typography } from "./typography";

interface TabsProps {
  children?: React.ReactNode;
  className?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    { children, className, value, defaultValue, onValueChange, ...props },
    ref,
  ) => {
    return (
      <ToggleGroupPrimitive.Root
        ref={ref}
        type="single"
        value={value}
        defaultValue={defaultValue}
        className={cn("grid w-full px-5 items-center auto-cols-fr", className)}
        style={{
          gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`,
        }}
        onValueChange={onValueChange}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    );
  },
);
Tabs.displayName = "Tabs";

// Alias for compatibility
const TabList = Tabs;
TabList.displayName = "TabList";

interface TabItemProps
  extends React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> {
  icon?: React.ReactNode;
  altIcon?: React.ReactNode;
  label?: string;
}

const TabItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  TabItemProps
>(({ icon, label, altIcon, className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "w-full flex-1 flex flex-col items-center justify-center gap-1 relative min-w-0 group",
      "focus:outline-none transition-colors duration-200 cursor-pointer",
      "text-gray-350 hover:text-gray-500 data-[state=on]:text-gray-900",
      className,
    )}
    {...props}
  >
    <Slot
      className={cn(
        "h-6.5 shrink-0",
        altIcon && "group-data-[state=on]:hidden",
      )}
    >
      {icon}
    </Slot>
    {altIcon && (
      <Slot className="h-6.5 shrink-0 hidden group-data-[state=on]:block">
        {altIcon}
      </Slot>
    )}
    {label && (
      <Typography
        as="span"
        variant="subtitle"
        className="text-2xs truncate w-full text-center px-1 leading-none"
      >
        {label}
      </Typography>
    )}
  </ToggleGroupPrimitive.Item>
));
TabItem.displayName = "TabItem";

export { TabItem, TabList, Tabs };
