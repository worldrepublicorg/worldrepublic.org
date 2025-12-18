"use client";

import * as ToastPrimitive from "@radix-ui/react-toast";
import * as React from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Fail, Success } from "./icons";
import { Typography } from "./typography";

// Toast state management
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;

type ToastVariant = "success" | "error";

interface ToastData {
  id: string;
  title?: string;
  variant?: ToastVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type ActionType =
  | { type: "ADD_TOAST"; toast: ToastData }
  | { type: "UPDATE_TOAST"; toast: Partial<ToastData> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToastData[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: ActionType) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId,
    });
  }, TOAST_REMOVE_DELAY);
  toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: ActionType): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined ? { ...t, open: false } : t,
        ),
      };
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return { ...state, toasts: [] };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

const toast = (props: Omit<ToastData, "id">) => {
  const id = genId();

  const update = (props: Partial<ToastData>) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return { id, dismiss, update };
};

export function useToast() {
  const [state, setState] = useState<State>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: {
      success: (props: Omit<ToastProps, "variant">) => {
        toast({ ...props, variant: "success" });
      },
      error: (props: Omit<ToastProps, "variant">) => {
        toast({ ...props, variant: "error" });
      },
    },
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

// Toast components
const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-6 z-100 flex max-h-screen w-full p-0.5 right-0 left-0 flex-col pointer-events-none",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> {
  title?: string;
  variant: ToastVariant;
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, title, variant, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "group pointer-events-none relative flex w-full items-center justify-center",
        "transition-all",
        "data-[swipe=cancel]:translate-x-0",
        "data-[swipe=end]:animate-out",
        "data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
        "data-[swipe=move]:transition-none",
        "data-[state=closed]:animate-out",
        "data-[state=closed]:slide-out-to-top-full",
        "data-[state=closed]:fade-out-50",
        "data-[state=open]:animate-in",
        "data-[state=open]:slide-in-from-top-full",
        "data-[state=open]:pointer-events-none",
      )}
      {...props}
    >
      <div className="grid grid-cols-[auto_1fr] items-center gap-2 rounded-full bg-gray-0 h-9 pl-2 pr-3 border border-gray-200 shrink-0 text-gray-900">
        {variant === "success" ? <Success /> : <Fail />}
        <div className="flex flex-1 items-center">
          <Typography variant="subtitle" level={3}>
            {title}
          </Typography>
        </div>
      </div>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = "Toast";

interface ToasterProps {
  duration?: number;
}

function Toaster({ duration }: ToasterProps) {
  const { toasts } = useToast();

  return (
    <ToastProvider duration={duration} swipeDirection="up">
      {toasts.map(({ id, variant, ...props }) => (
        <Toast key={id} variant={variant!} {...props} />
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
Toaster.displayName = "Toaster";

export { Toast, Toaster, ToastProvider, ToastViewport };
