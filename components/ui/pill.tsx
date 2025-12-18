"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { typographyVariants } from "./typography";

const pillVariants = cva(
  "inline-flex h-9 items-center rounded-full px-4 transition-colors duration-200 cursor-pointer",
  {
    variants: {
      checked: {
        true: "bg-gray-100",
        false: "bg-transparent",
      },
    },
    defaultVariants: {
      checked: false,
    },
  },
);

export interface PillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof pillVariants> {
  asChild?: boolean;
}

export const Pill = forwardRef<HTMLButtonElement, PillProps>(
  ({ checked, children, asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          pillVariants({ checked }),
          typographyVariants({ variant: "label", level: 2 }),
          className,
        )}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

Pill.displayName = "Pill";
