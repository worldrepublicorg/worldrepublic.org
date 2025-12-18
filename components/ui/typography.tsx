import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const typographyVariants = cva("font-sans antialiased", {
  variants: {
    variant: {
      display: "font-semibold leading-narrow tracking-[-0.02em]",
      heading: "font-semibold leading-narrow tracking-[-0.01em]",
      subtitle: "font-medium leading-narrow",
      label: "font-semibold leading-narrow",
      body: "font-normal leading-compact",
      number: "font-semibold leading-narrow",
    },
    level: {
      1: "",
      2: "",
      3: "",
      4: "",
      5: "",
      6: "",
    },
  },
  compoundVariants: [
    // Display
    { variant: "display", level: 1, className: "text-7xl" },
    // Heading
    { variant: "heading", level: 1, className: "text-4xl" },
    { variant: "heading", level: 2, className: "text-3xl" },
    { variant: "heading", level: 3, className: "text-2xl" },
    { variant: "heading", level: 4, className: "text-[1.375rem]" },
    // Subtitle
    { variant: "subtitle", level: 1, className: "text-lg" },
    { variant: "subtitle", level: 2, className: "text-base" },
    { variant: "subtitle", level: 3, className: "text-sm" },
    { variant: "subtitle", level: 4, className: "text-xs" },
    // Label
    { variant: "label", level: 1, className: "text-base" },
    { variant: "label", level: 2, className: "text-sm" },
    // Body
    { variant: "body", level: 1, className: "text-lg" },
    { variant: "body", level: 2, className: "text-base" },
    { variant: "body", level: 3, className: "text-sm" },
    { variant: "body", level: 4, className: "text-xs" },
    // Number
    { variant: "number", level: 1, className: "text-6xl tracking-[-0.01em]" },
    { variant: "number", level: 2, className: "text-5xl tracking-[-0.02em]" },
    { variant: "number", level: 3, className: "text-3xl tracking-[-0.01em]" },
    { variant: "number", level: 4, className: "text-xl tracking-[-0.02em]" },
    { variant: "number", level: 5, className: "text-base tracking-[-0.02em]" },
  ],
  defaultVariants: {
    variant: "body",
    level: 2,
  },
});

export type TypographyVariant = NonNullable<
  VariantProps<typeof typographyVariants>["variant"]
>;
export type TypographyLevel = NonNullable<
  VariantProps<typeof typographyVariants>["level"]
>;

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  as?: React.ElementType;
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = "body",
      level = 2,
      children,
      as: Component = "p",
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        className={cn(typographyVariants({ variant, level, className }))}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Typography.displayName = "Typography";
