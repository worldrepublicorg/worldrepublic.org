"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { createChangeEvent } from "@/lib/utils";
import { ClearButton } from "./clear-button";
import { Input, type InputProps } from "./input";
import { PasteButton } from "./paste-button";

interface WalletAddressFieldProps
  extends Omit<
    InputProps,
    "startAdornment" | "endAdornment" | "error" | "isValid"
  > {
  /**
   * If true, the input will display in an error state with error styling
   */
  error?: boolean;
  /**
   * If true, the input will display in a valid state with success styling
   */
  isValid?: boolean;
  /**
   * Label for the input
   * @default "Wallet address"
   */
  label?: string;
  /**
   * Label for the paste button
   * @default "Paste"
   */
  pasteButtonLabel?: string;
  /**
   * If true, validates that the address is not the contract address
   */
  validateContractAddress?: boolean;
  /**
   * Contract address to validate against
   */
  contractAddress?: string;
  /**
   * Custom error message for invalid address
   */
  invalidAddressMessage?: string;
  /**
   * Custom error message for contract address
   */
  contractAddressMessage?: string;
  /**
   * Callback when validation state changes
   */
  onValidationChange?: (isValid: boolean, error: string | null) => void;
}

const WalletAddressField = forwardRef<
  HTMLInputElement,
  WalletAddressFieldProps
>(
  (
    {
      isValid: isValidProp,
      disabled,
      type = "text",
      autoComplete = "off",
      spellCheck = "false",
      label = "Wallet address",
      pasteButtonLabel = "Paste",
      validateContractAddress = false,
      contractAddress,
      invalidAddressMessage = "Invalid address",
      contractAddressMessage = "Cannot use contract address",
      onValidationChange,
      value: valueProp,
      ...props
    },
    forwardedRef,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isPasted, setIsPasted] = useState(false);
    const [value, setValue] = useState(valueProp || "");
    const [isFocused, setIsFocused] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [internalIsValid, setInternalIsValid] = useState(false);

    useImperativeHandle(forwardedRef, () => inputRef.current!);

    // Sync value prop with internal state
    useEffect(() => {
      if (valueProp !== undefined && valueProp !== value) {
        setValue(valueProp);
      }
    }, [valueProp]);

    // Validation logic
    useEffect(() => {
      const currentValue = String(valueProp !== undefined ? valueProp : value);

      if (!currentValue) {
        setInternalError(null);
        setInternalIsValid(false);
        onValidationChange?.(false, null);
        return;
      }

      // Check if address is a valid EVM address (0x followed by 40 hex characters)
      const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!evmAddressRegex.test(currentValue)) {
        setInternalError(invalidAddressMessage);
        setInternalIsValid(false);
        onValidationChange?.(false, invalidAddressMessage);
        return;
      }

      // Check if the address is the token's contract address (if enabled)
      if (validateContractAddress && contractAddress) {
        if (currentValue.toLowerCase() === contractAddress.toLowerCase()) {
          setInternalError(contractAddressMessage);
          setInternalIsValid(false);
          onValidationChange?.(false, contractAddressMessage);
          return;
        }
      }

      setInternalError(null);
      setInternalIsValid(true);
      onValidationChange?.(true, null);
    }, [
      value,
      valueProp,
      validateContractAddress,
      contractAddress,
      invalidAddressMessage,
      contractAddressMessage,
      onValidationChange,
    ]);

    // Use prop isValid/error if provided, otherwise use internal validation
    const isValid = isValidProp !== undefined ? isValidProp : internalIsValid;
    const error = internalError !== null;

    // Handler for clearing the input
    const handleClear = () => {
      if (inputRef.current) {
        // Set the input value directly first
        inputRef.current.value = "";

        // Create a native input event and dispatch it
        // This will trigger React's onChange handler naturally
        const nativeEvent = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(nativeEvent);

        // Also create a React change event for the onChange handler
        const event = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;

        // Call the Input's onChange handler logic directly
        // This ensures both parent onChange and internal state update
        props.onChange?.(event);
        const newValue = event.target.value; // This will be ""
        setValue(newValue);
        setIsPasted(false);
      }
    };

    let endAdornment;
    const currentValue = String(valueProp !== undefined ? valueProp : value);
    if (!disabled && !isPasted && !currentValue) {
      endAdornment = (
        <PasteButton
          inputRef={inputRef}
          label={pasteButtonLabel}
          onPaste={(pastedValue) => {
            if (inputRef.current) {
              const event = createChangeEvent(inputRef.current);
              props.onChange?.(event);
              setIsPasted(true);
            }
          }}
        />
      );
    } else if (isFocused && !disabled && currentValue) {
      endAdornment = <ClearButton onClear={handleClear} />;
    }

    return (
      <Input
        {...props}
        ref={inputRef}
        value={valueProp !== undefined ? valueProp : value}
        isValid={isValid && !error}
        error={error}
        disabled={disabled}
        endAdornment={endAdornment}
        type={type}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        label={label}
        variant="floating-label"
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        onChange={(e) => {
          props.onChange?.(e);
          const newValue = e.target.value;
          setValue(newValue);
          if (newValue) {
            setIsPasted(false);
          }
        }}
      />
    );
  },
);

WalletAddressField.displayName = "WalletAddressField";

export { WalletAddressField };
export type { WalletAddressFieldProps };
