import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { typographyVariants } from "./typography";

const buttonVariants = cva(
  "flex items-center justify-center rounded-full gap-2 font-sans leading-[1.2] tracking-normal transition-colors cursor-pointer disabled:cursor-default",
  {
    variants: {
      variant: {
        primary:
          "bg-gray-900 text-gray-0 disabled:bg-gray-100 disabled:text-gray-300",
        secondary:
          "bg-transparent text-gray-900 border border-gray-200 disabled:text-gray-300 disabled:border-gray-100",
        tertiary:
          "bg-gray-100 text-gray-900 disabled:text-gray-300 disabled:bg-gray-50",
      },
      size: {
        sm: "h-10 min-w-10 px-4",
        lg: "h-14 min-w-14 px-4",
        icon: "size-10",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "lg",
      fullWidth,
      asChild,
      onClick,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        {...props}
        className={cn(
          buttonVariants({ variant, size, fullWidth }),
          typographyVariants({
            variant: "label",
            level: size === "lg" ? 1 : 2,
          }),
          className,
        )}
        onClick={onClick}
      >
        {children}
      </Comp>
    );
  },
);

Button.displayName = "Button";
