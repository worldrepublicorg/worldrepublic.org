import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import Link from "next/link";
import { forwardRef } from "react";
import { CustomListItemProps } from "@/lib/types";
import { cn } from "@/lib/utils";

const CustomListItem = forwardRef<HTMLButtonElement, CustomListItemProps>(
  (
    {
      children,
      label,
      description,
      startAdornment,
      endAdornment,
      disabled,
      href,
      noPointer,
      ...props
    },
    ref,
  ) => {
    const content = (
      <>
        {startAdornment && (
          <div className="mr-3 shrink-0">{startAdornment}</div>
        )}
        <div className="flex min-w-0 grow flex-col items-start gap-0.5">
          {children ?? (
            <>
              {label && (
                <Typography
                  variant="subtitle"
                  level={3}
                  className="w-full grow truncate text-left"
                >
                  {label}
                </Typography>
              )}
              {description && (
                <Typography
                  level={4}
                  className={cn(
                    "w-full grow truncate text-left",
                    disabled ? "text-gray-300" : "text-gray-500",
                  )}
                >
                  {description}
                </Typography>
              )}
            </>
          )}
        </div>
        {endAdornment && <div className="ml-4 shrink-0">{endAdornment}</div>}
      </>
    );

    const component = (
      <button
        ref={ref}
        className={cn(
          "min-h-14 bg-gray-50 p-4 rounded-2xl flex items-center text-gray-900 w-full disabled:text-gray-300 disabled:cursor-not-allowed transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 active:scale-[0.99]",
          noPointer ? "cursor-default" : "cursor-pointer",
        )}
        {...props}
        disabled={disabled}
      >
        {content}
      </button>
    );

    if (href) {
      return (
        <Link href={href} passHref className="w-full">
          {component}
        </Link>
      );
    }

    return component;
  },
);

CustomListItem.displayName = "CustomListItem";

export { CustomListItem };
