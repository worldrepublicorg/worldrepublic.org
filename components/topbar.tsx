import { Typography } from "@worldcoin/mini-apps-ui-kit-react";
import React from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  /** Title displayed in the center */
  title?: string;
  /** Element rendered on the left side */
  startAdornment?: React.ReactNode;
  /** Element rendered on the right side */
  endAdornment?: React.ReactNode;
  /** Additional class name for the top bar */
  className?: string;
}

function TopBar({
  title,
  startAdornment,
  endAdornment,
  className,
}: TopBarProps) {
  const hasStartAdornment = Boolean(startAdornment);
  const hasEndAdornment = Boolean(endAdornment);
  const textAlignment = hasStartAdornment ? "text-center" : "text-left";
  const justifyContent =
    hasStartAdornment || hasEndAdornment ? "justify-between" : "justify-start";

  return (
    <div
      className={cn(
        "flex items-center px-6 pt-6 pb-2 w-full h-18 gap-6",
        justifyContent,
        className,
      )}
    >
      {startAdornment && <div className="shrink-0">{startAdornment}</div>}
      <Typography
        variant={hasStartAdornment ? "subtitle" : "heading"}
        level={hasStartAdornment ? 1 : 4}
        className={cn(
          "flex-1 grow truncate",
          textAlignment,
          !hasStartAdornment && "text-[24px]",
        )}
      >
        {title}
      </Typography>
      {endAdornment && <div className="shrink-0">{endAdornment}</div>}
      {!endAdornment && hasStartAdornment && (
        <div className="shrink-0 invisible" aria-hidden="true">
          {startAdornment}
        </div>
      )}
    </div>
  );
}

TopBar.displayName = "TopBar";

export { TopBar };
