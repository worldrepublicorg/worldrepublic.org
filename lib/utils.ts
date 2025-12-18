import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number to display the full amount without scientific notation
 * @param num - The number to format
 * @returns A string representation of the number with up to 18 decimal places
 */
export const formatFullAmount = (num: number): string => {
  if (!isFinite(num) || num === 0) return "0";
  let s = num.toFixed(50);
  const dotIndex = s.indexOf(".");
  if (dotIndex !== -1) {
    s = s.substring(0, dotIndex + 1 + 18);
  }
  s = s.replace(/0+$/, "");
  s = s.replace(/\.$/, "");
  return s;
};

/**
 * Determines the number of decimal places to display for balance values
 * @param balance - The balance value
 * @returns The number of decimal places to display (2, 3, or 4)
 */
export const getBalancePrecision = (balance: number): number => {
  if (balance === 0) {
    return 2; // Show 2 decimals for zero balance
  } else if (balance < 0.01) {
    return 4; // Show 4 decimals for very small amounts
  } else if (balance < 0.1) {
    return 3; // Show 3 decimals for small amounts
  } else {
    return 2; // Show 2 decimals for normal amounts
  }
};

/**
 * Truncates a number to a specified precision (truncates, doesn't round)
 * @param num - The number to truncate
 * @param precision - The number of decimal places to keep
 * @returns The truncated number
 */
export const truncateToPrecision = (num: number, precision: number): number => {
  const multiplier = Math.pow(10, precision);
  return Math.floor(num * multiplier) / multiplier;
};

/**
 * Copies text to clipboard with proper error handling
 * @param text - The text to copy to clipboard
 * @param toast - Toast function from useToast hook
 * @param messages - Optional explicit success/error messages
 * @returns Promise that resolves to true if successful, false otherwise
 */
export const copyToClipboard = async (
  text: string,
  toast: {
    success: (options: { title: string }) => void;
    error: (options: { title: string }) => void;
  },
  messages?: { success?: string; error?: string },
): Promise<boolean> => {
  // Check if clipboard API is available
  if (!navigator.clipboard) {
    toast.error({
      title: messages?.error || "Clipboard not available",
    });
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    toast.success({
      title: messages?.success || "Copied",
    });
    return true;
  } catch (error) {
    console.error("Error copying to clipboard:", error);
    toast.error({
      title: messages?.error || "Clipboard not accessible",
    });
    return false;
  }
};

/**
 * Reserved usernames that cannot be used
 */
const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "system",
  "support",
  "help",
  "api",
  "www",
  "mail",
  "root",
  "null",
  "undefined",
  "true",
  "false",
]);

/**
 * Validates a username according to the following rules:
 * - 3-30 characters long
 * - Only alphanumeric characters, underscores, and hyphens
 * - Must start with a letter or number
 * - Cannot be a reserved username
 * - Case-insensitive uniqueness is enforced at database level
 * @param username - The username to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateUsername(username: string): {
  isValid: boolean;
  error?: string;
} {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { isValid: false, error: "Username must be at least 3 characters" };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: "Username must be at most 30 characters" };
  }

  // Only alphanumeric, underscore, and hyphen
  const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      isValid: false,
      error:
        "Username can only contain letters, numbers, underscores, and hyphens, and must start and end with a letter or number",
    };
  }

  // Check reserved usernames (case-insensitive)
  if (RESERVED_USERNAMES.has(trimmed.toLowerCase())) {
    return { isValid: false, error: "This username is reserved" };
  }

  return { isValid: true };
}
