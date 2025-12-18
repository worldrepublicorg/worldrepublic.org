import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";
import { typographyVariants } from "./typography";

const textAreaVariants = cva(
  cn(
    "min-h-[7.5rem] resize-y peer w-full rounded-[0.625rem] border border-gray-100 bg-gray-100 px-4 outline-none transition duration-300",
    "placeholder:text-gray-500",
    "focus:border-gray-300 focus:bg-gray-0 focus-visible:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ),
  {
    variants: {
      error: {
        true: "border-error-600 focus:border-error-600 bg-gray-0",
      },
      isFocused: {
        true: "focus:border-gray-300 focus:bg-gray-0 focus-visible:outline-none",
        false: "",
      },
      variant: {
        "floating-label": "pt-8 pb-2 placeholder:text-transparent",
        default: "pt-4",
      },
    },
    defaultVariants: {
      error: false,
      isFocused: false,
      variant: "default",
    },
  },
);

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textAreaVariants> {
  label?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      error,
      isFocused = false,
      disabled,
      label,
      variant = "default",
      id,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div className="relative flex w-full items-center group">
        <textarea
          ref={ref}
          id={id}
          placeholder={label}
          disabled={disabled}
          className={cn(
            textAreaVariants({ error, isFocused, variant }),
            typographyVariants({ variant: "body" }),
            className,
          )}
          {...props}
        />
        {variant === "floating-label" && (
          <label
            htmlFor={id}
            className={cn(
              typographyVariants({ variant: "body", level: 3 }),
              cn(
                // Initial state
                "peer-placeholder-shown:text-sm",
                "peer-focus:text-xs peer-focus:border-gray-300 peer-focus:bg-gray-0",
                // End state
                "absolute text-gray-500 duration-300 transform text-xs top-0 pt-4 z-10 pl-4 w-full bg-gray-100 rounded-t-[0.625rem] border-t border-x border-gray-100",
              ),
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  },
);

TextArea.displayName = "TextArea";
