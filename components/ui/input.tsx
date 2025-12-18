"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Tick } from "./icons";
import { typographyVariants } from "./typography";

const inputContainerVariants = cva(
  [
    "bg-gray-100",
    "text-gray-900",
    "h-[3.5rem]",
    "inline-flex",
    "w-full",
    "shrink",
    "cursor-text",
    "items-center",
    "overflow-hidden",
    "border",
    "border-gray-100",
    "rounded-[0.625rem]",
    "outline-none",
    "transition-all",
    "duration-300",
    "ease-out",
    "px-4",
    // Focus state
    "focus-within:border-gray-300",
    "focus-within:bg-gray-0",
    "focus-within:isolate",
    // Disabled state
    "has-[input:disabled]:cursor-not-allowed",
    "has-[input:disabled]:opacity-50",
  ],
  {
    variants: {
      error: {
        true: [
          "bg-gray-0",
          "border-error-600",
          "focus-within:border-error-600",
        ],
        false: "",
      },
      areDividers: {
        true: "gap-2.5",
        false: "gap-2",
      },
    },
    defaultVariants: {
      error: false,
      areDividers: false,
    },
  },
);

const inputElementVariants = cva(
  [
    "peer",
    "inline-block",
    "h-full",
    "grow",
    "w-full",
    "appearance-none",
    "bg-transparent",
    "border-none",
    "text-gray-900",
    "placeholder:text-transparent",
    "focus:outline-none",
    "focus-visible:outline-none",
    "disabled:cursor-not-allowed",
  ],
  {
    variants: {
      variant: {
        default: "placeholder:text-gray-500",
        "floating-label": ["pt-6 pb-2"],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const floatingLabelVariants = cva([
  "text-gray-500",
  "pointer-events-none",
  "absolute",
  "start-0",
  "w-fit",
  "max-w-full",
  "top-1/2",
  "overflow-hidden",
  "bg-transparent",
  "text-ellipsis",
  "whitespace-nowrap",
  // Positioning & Transition
  "translate-y-[-50%]",
  "transition-[top,transform,scale,opacity,color]",
  "duration-100",
  "ease-out",
  // Peer states for floating effect
  "peer-focus:pointer-events-auto",
  "peer-focus:top-[1.125rem]",
  "peer-focus:text-xs",
  "peer-focus:bg-base-100",
  // State when placeholder is not shown
  "peer-[:not(:placeholder-shown)]:pointer-events-auto",
  "peer-[:not(:placeholder-shown)]:top-[1.125rem]",
  "peer-[:not(:placeholder-shown)]:text-xs",
]);

const dividerVariants = cva("border-r h-[1.625rem] w-1", {
  variants: {
    error: {
      true: "border-error-600",
      false: "border-gray-300",
    },
  },
  defaultVariants: {
    error: false,
  },
});

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputContainerVariants> {
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  isValid?: boolean;
  label?: string;
  showStartDivider?: boolean;
  showEndDivider?: boolean;
  variant?: "default" | "floating-label";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      error = false,
      startAdornment,
      endAdornment,
      isValid,
      disabled,
      className,
      label,
      id: providedId,
      showStartDivider = false,
      showEndDivider = false,
      variant = "default",
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const id = providedId || generatedId;
    const hasStartAdornment = !!startAdornment;
    const hasEndAdornment = isValid || !!endAdornment;

    return (
      <div
        className={cn(
          inputContainerVariants({
            error,
            areDividers: showStartDivider || showEndDivider,
          }),
          className,
        )}
      >
        {hasStartAdornment && (
          <>
            <div className="inline-flex items-center justify-center shrink-0 text-gray-500">
              {startAdornment}
            </div>
            {showStartDivider && <div className={dividerVariants({ error })} />}
          </>
        )}

        {variant === "floating-label" ? (
          <div className="relative grow h-full">
            <input
              ref={ref}
              id={id}
              type={type}
              placeholder={label || " "}
              disabled={disabled}
              aria-invalid={error ?? undefined}
              className={cn(
                typographyVariants({ variant: "body", level: 3 }),
                inputElementVariants({ variant }),
              )}
              {...props}
            />
            <label
              className={cn(
                floatingLabelVariants(),
                typographyVariants({ variant: "body", level: 3 }),
              )}
              htmlFor={id}
            >
              {label}
            </label>
          </div>
        ) : (
          <>
            {label && (
              <label className="sr-only" htmlFor={id}>
                {label}
              </label>
            )}
            <input
              ref={ref}
              id={id}
              type={type}
              placeholder={label}
              disabled={disabled}
              aria-invalid={error ?? undefined}
              className={cn(
                inputElementVariants({ variant }),
                typographyVariants({ variant: "body", level: 3 }),
              )}
              {...props}
            />
          </>
        )}

        {hasEndAdornment && (
          <>
            {showEndDivider && <div className={dividerVariants({ error })} />}
            <div className="inline-flex items-center justify-center shrink-0 text-gray-500">
              {isValid ? <Tick className="text-success-700" /> : endAdornment}
            </div>
          </>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
