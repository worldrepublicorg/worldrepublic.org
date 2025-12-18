"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { XMark } from "./icons";
import { Typography } from "./typography";

// Context for drawer state
interface DrawerContextValue {
  dismissible: boolean;
  height: "full" | "auto";
}

const DrawerContext = React.createContext<DrawerContextValue | undefined>(
  undefined,
);

const useDrawer = () => {
  const context = React.useContext(DrawerContext);
  if (context === undefined) {
    throw new Error("useDrawer must be used within a Drawer");
  }
  return context;
};

interface DrawerProps {
  dismissible?: boolean;
  height?: "full" | "auto";
  modal?: boolean;
  repositionInputs?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

const Drawer = ({
  dismissible = true,
  height = "full",
  modal = true,
  repositionInputs = false,
  open,
  onOpenChange,
  children,
}: DrawerProps) => (
  <DrawerContext.Provider value={{ dismissible, height }}>
    <DrawerPrimitive.Root
      shouldScaleBackground={false}
      dismissible={dismissible}
      modal={modal}
      direction="bottom"
      handleOnly
      repositionInputs={repositionInputs}
      open={open}
      onOpenChange={onOpenChange}
    >
      {children}
    </DrawerPrimitive.Root>
  </DrawerContext.Provider>
);
Drawer.displayName = "Drawer";

const DrawerTrigger = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger>
>((props, ref) => <DrawerPrimitive.Trigger ref={ref} {...props} />);
DrawerTrigger.displayName = "DrawerTrigger";

const DrawerClose = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>
>((props, ref) => <DrawerPrimitive.Close ref={ref} {...props} />);
DrawerClose.displayName = "DrawerClose";

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>((props, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className="fixed inset-0 z-50 bg-gray-900/40"
    {...props}
  />
));
DrawerOverlay.displayName = "DrawerOverlay";

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>((props, ref) => {
  const { height } = useDrawer();
  return (
    <DrawerPrimitive.Portal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        {...props}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-gray-0 outline-none flex flex-col",
          height === "full"
            ? "top-0 rounded-none"
            : "h-auto rounded-t-[1.75rem]",
          props.className,
        )}
      />
    </DrawerPrimitive.Portal>
  );
});
DrawerContent.displayName = "DrawerContent";

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
}

const DrawerHeader = ({ icon, children, ...props }: DrawerHeaderProps) => {
  const { dismissible } = useDrawer();
  return (
    <div
      className="flex justify-between items-center gap-4 mb-2 w-full"
      {...props}
    >
      {dismissible && (
        <div className="shrink-0">
          <DrawerClose asChild>
            <Button variant="tertiary" size="icon">
              <XMark />
            </Button>
          </DrawerClose>
        </div>
      )}
      <div className="flex flex-col gap-6">{children}</div>
      {dismissible && <div className="shrink-0 size-10" />}
    </div>
  );
};
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ children, ...props }, ref) => (
  <DrawerPrimitive.Title ref={ref} {...props} asChild>
    <Typography variant="subtitle" level={1}>
      {children}
    </Typography>
  </DrawerPrimitive.Title>
));
DrawerTitle.displayName = "DrawerTitle";

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ children, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className="text-gray-500"
    {...props}
    asChild
  >
    <Typography variant="body" level={2}>
      {children}
    </Typography>
  </DrawerPrimitive.Description>
));
DrawerDescription.displayName = "DrawerDescription";

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
};
