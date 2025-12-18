"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { XMark } from "./icons";
import { Typography } from "./typography";

// Context for dialog dismissible state
const AlertDialogContext = React.createContext<
  { dismissible: boolean } | undefined
>(undefined);

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext);
  if (context === undefined) {
    throw new Error("useAlertDialog must be used within an AlertDialog");
  }
  return context;
};

// Safe area insets hook
function useSafeAreaInsets() {
  const defaultInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  const [safeAreaInsets, setSafeAreaInsets] = React.useState(() => {
    if (typeof window !== "undefined") {
      // @ts-expect-error MiniKit is a global injected by the World App
      return window?.MiniKit?.deviceProperties?.safeAreaInsets ?? defaultInsets;
    }
    return defaultInsets;
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-expect-error MiniKit is a global injected by the World App
      const insets = window?.MiniKit?.deviceProperties?.safeAreaInsets;
      if (insets && JSON.stringify(insets) !== JSON.stringify(safeAreaInsets)) {
        setSafeAreaInsets(insets);
      }
    }
  }, [safeAreaInsets]);

  return safeAreaInsets;
}

// BottomBar component (used in AlertDialogFooter)
interface BottomBarProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
}

const BottomBar = React.forwardRef<HTMLDivElement, BottomBarProps>(
  ({ children, direction = "horizontal", className, ...props }, ref) => {
    const directionClasses =
      direction === "vertical"
        ? "flex flex-col-reverse"
        : "grid grid-cols-1 [&>*]:col-span-1 [&:has(>*:nth-child(2))]:grid-cols-2";
    return (
      <div
        ref={ref}
        className={cn("w-full gap-4", directionClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
BottomBar.displayName = "BottomBar";

// AlertDialog components
interface AlertDialogProps {
  dismissible?: boolean;
  modal?: boolean;
  repositionInputs?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const AlertDialog = ({
  dismissible = true,
  modal = true,
  repositionInputs = false,
  open,
  onOpenChange,
  children,
}: AlertDialogProps) => (
  <AlertDialogContext.Provider value={{ dismissible }}>
    <Drawer.Root
      shouldScaleBackground={false}
      dismissible={dismissible}
      modal={modal}
      repositionInputs={repositionInputs}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </Drawer.Root>
  </AlertDialogContext.Provider>
);
AlertDialog.displayName = "AlertDialog";

const AlertDialogTrigger = React.forwardRef<
  React.ElementRef<typeof Drawer.Trigger>,
  React.ComponentPropsWithoutRef<typeof Drawer.Trigger>
>((props, ref) => <Drawer.Trigger ref={ref} {...props} />);
AlertDialogTrigger.displayName = "AlertDialogTrigger";

const AlertDialogPortal = Drawer.Portal;

const AlertDialogClose = React.forwardRef<
  React.ElementRef<typeof Drawer.Close>,
  React.ComponentPropsWithoutRef<typeof Drawer.Close>
>((props, ref) => <Drawer.Close ref={ref} {...props} />);
AlertDialogClose.displayName = "AlertDialogClose";

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content>
>(({ className, children, ...props }, ref) => {
  const safe = useSafeAreaInsets();
  return (
    <AlertDialogPortal>
      <Drawer.Overlay
        className={cn("fixed inset-0 z-50 bg-gray-900/40", className)}
      />
      <Drawer.Content
        ref={ref}
        className={cn("fixed inset-x-0 bottom-0 z-50 mt-24 h-auto", className)}
        {...props}
      >
        <div
          className="flex flex-col rounded-[1.75rem] bg-gray-0 m-3 p-8"
          style={{
            marginBottom: Math.max(safe.bottom, 12),
          }}
        >
          {children}
        </div>
      </Drawer.Content>
    </AlertDialogPortal>
  );
});
AlertDialogContent.displayName = "AlertDialogContent";

interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

const AlertDialogHeader = ({
  icon,
  children,
  ...props
}: AlertDialogHeaderProps) => {
  const { dismissible } = useAlertDialog();
  const closeButton = dismissible && (
    <div className="shrink-0">
      <AlertDialogClose asChild>
        <Button variant="tertiary" size="icon">
          <XMark />
        </Button>
      </AlertDialogClose>
    </div>
  );

  const baseClasses = "flex justify-between w-full";

  if (icon) {
    return (
      <div className="mb-4 flex flex-col gap-6">
        <div className={cn(baseClasses)} {...props}>
          <div className="flex flex-col">{icon}</div>
          {closeButton}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, "gap-4 mb-4 items-center")} {...props}>
      <div className="flex flex-col gap-6">{children}</div>
      {closeButton}
    </div>
  );
};
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = (props: BottomBarProps) => <BottomBar {...props} />;
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ children, ...props }, ref) => (
  <Drawer.Title ref={ref} {...props} asChild>
    <Typography variant="heading" level={2}>
      {children}
    </Typography>
  </Drawer.Title>
));
AlertDialogTitle.displayName = "AlertDialogTitle";

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, children, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn("text-gray-500 mb-8", className)}
    {...props}
    asChild
  >
    <Typography>{children}</Typography>
  </Drawer.Description>
));
AlertDialogDescription.displayName = "AlertDialogDescription";

export {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
