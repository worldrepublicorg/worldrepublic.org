"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowDown } from "./icons";
import { typographyVariants } from "./typography";

const DROPDOWN_CONTAINER_STYLES =
  "relative z-50 mt-1 max-h-[11.75rem] w-full overflow-hidden rounded-[0.625rem] bg-gray-0 border border-gray-300";

const selectVariants = cva(
  cn(
    "flex items-center justify-between whitespace-nowrap [&>span:first-of-type]:line-clamp-1",
    "peer h-[3.5rem] w-full rounded-[0.625rem] border border-gray-100 bg-gray-100 px-4 outline-none transition duration-300",
    "placeholder:text-gray-500",
    "focus:border-gray-300 focus:bg-gray-0 focus-visible:outline-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Radix Select styles
    "data-[placeholder]:text-gray-500",
    "data-[state=closed]:bg-gray-100 data-[state=closed]:border-gray-100",
  ),
  {
    variants: {
      error: {
        true: "!border-error-600 !focus:border-error-600 !bg-gray-0",
      },
      isLabel: {
        true: "pt-6 pb-2 placeholder:text-transparent",
        false: "",
      },
      isFocused: {
        true: "focus:border-gray-300 focus:bg-gray-0 focus-visible:outline-none",
        false: "",
      },
      variant: {
        "floating-label": "pt-6 pb-2 placeholder:text-transparent",
        default: "",
      },
    },
    defaultVariants: {
      error: false,
      isFocused: false,
      variant: "default",
    },
  },
);

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends VariantProps<typeof selectVariants>,
    Omit<
      React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>,
      "onValueChange"
    > {
  options?: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: boolean;
}

export const Select = forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectProps
>(
  (
    {
      options = [],
      placeholder = "Select...",
      value,
      onChange,
      open,
      onOpenChange,
      error = false,
      defaultOpen = false,
      disabled = false,
      name,
      defaultValue,
      ...rest
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(open ?? defaultOpen);

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    };

    useEffect(() => {
      if (open !== undefined) {
        setIsOpen(open);
      }
    }, [open]);

    if (!Array.isArray(options)) {
      console.error(
        "`options` must be an array of objects with `value` and `label` keys.",
      );
    }

    return (
      <SelectPrimitive.Root
        value={value}
        open={isOpen}
        onValueChange={onChange}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        name={name}
        disabled={disabled}
        defaultValue={defaultValue}
        {...rest}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            typographyVariants({ variant: "body" }),
            selectVariants({ error, isFocused: isOpen }),
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ArrowDown className="text-gray-400 size-6" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className={cn(DROPDOWN_CONTAINER_STYLES)}
          >
            <SelectPrimitive.Viewport
              className={cn(
                "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) p-2",
                options.length === 0 && "hidden",
              )}
            >
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={`${option.value}/${option.label}`}
                  value={option.value}
                  className={cn(
                    "w-full cursor-pointer select-none rounded-md p-2 font-sans outline-none hover:bg-gray-50",
                    value === option.value && "bg-gray-100",
                    typographyVariants({ variant: "body", level: 3 }),
                  )}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  },
);

Select.displayName = "Select";

// Re-export primitives for advanced usage
export { SelectPrimitive as SelectRoot };
