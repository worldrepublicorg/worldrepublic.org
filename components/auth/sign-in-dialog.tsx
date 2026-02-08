"use client";

import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  Input,
  Typography,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { PiFingerprint, PiSignIn } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import {
  getPasskeyOptions,
  getPasskeyRegistrationOptions,
  verifyPasskeyAuthentication,
  verifyPasskeyRegistration,
} from "@/lib/actions/passkey";

interface SignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dictionary: Dictionary;
}

export function SignInDialog({
  open,
  onOpenChange,
  dictionary,
}: SignInDialogProps) {
  const router = useRouter();
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [showPasskeyOptions, setShowPasskeyOptions] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", {
      callbackUrl: "/",
    });
    onOpenChange(false);
  };

  const handleUseBiometrics = () => {
    setShowPasskeyOptions(true);
  };

  const handlePasskeySignIn = async () => {
    setIsLoading(true);
    try {
      // Step 1: Get authentication options from server
      const optionsResult = await getPasskeyOptions();

      if (optionsResult.error) {
        throw new Error(
          optionsResult.error || "Failed to get authentication options",
        );
      }

      // TypeScript narrowing: after error check, we know it's the success type
      if (!("challenge" in optionsResult)) {
        throw new Error("Invalid authentication options");
      }

      // If no credentials exist, go straight to registration (create account flow)
      if (optionsResult.passkeyCount === 0) {
        setShowNameInput(true);
        setIsLoading(false);
        return;
      }

      const { challenge } = optionsResult;

      // Step 2: Start WebAuthn authentication in the browser
      let authenticationResponse;
      try {
        authenticationResponse = await startAuthentication(optionsResult);
      } catch (error) {
        // User cancelled
        if (
          error instanceof Error &&
          (error.name === "NotAllowedError" ||
            error.name === "AbortError" ||
            error.message.includes("cancel") ||
            error.message.includes("abort"))
        ) {
          setIsLoading(false);
          return;
        }
        throw error;
      }

      // Step 3: Verify the authentication response
      const verifyResult = await verifyPasskeyAuthentication(
        authenticationResponse,
        challenge,
      );

      if (verifyResult.error) {
        throw new Error(verifyResult.error || "Authentication failed");
      }

      if (verifyResult.verified) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await update();
        router.refresh();
        setShowPasskeyOptions(false);
        setShowNameInput(false);
        onOpenChange(false);
      } else {
        throw new Error("Authentication verification failed");
      }
    } catch (error) {
      console.error("Passkey sign-in error:", error);
      setIsLoading(false);
    }
  };

  const handlePasskeyRegister = async (name?: string) => {
    setIsLoading(true);
    try {
      // Step 1: Get registration options
      // Always create a new account, even if user has existing credentials
      const optionsResult = await getPasskeyRegistrationOptions(
        null,
        name || passkeyName || undefined,
      );

      if (optionsResult.error) {
        throw new Error(
          optionsResult.error || "Failed to get registration options",
        );
      }

      // TypeScript narrowing: after error check, we know it's the success type
      if (!("challenge" in optionsResult)) {
        throw new Error("Invalid registration options");
      }

      const { challenge, tempUserId, tempEmail } = optionsResult;

      // Step 2: Start WebAuthn registration in the browser
      let registrationResponse;
      try {
        registrationResponse = await startRegistration(optionsResult);
      } catch (error) {
        // Handle browser errors
        if (
          error instanceof Error &&
          (error.message.includes("already registered") ||
            error.message.includes("device") ||
            error.name === "NotAllowedError")
        ) {
          // Browser is preventing registration - might be device restriction
          // User can try again or use a different authenticator
          setIsLoading(false);
          return;
        }
        throw error;
      }

      // Step 3: Verify the registration response
      const verifyResult = await verifyPasskeyRegistration(
        registrationResponse,
        challenge,
        tempUserId,
        tempEmail,
        name || passkeyName || undefined,
      );

      if (verifyResult.error) {
        throw new Error(verifyResult.error || "Registration failed");
      }

      if (verifyResult.verified) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await update();
        router.refresh();
        setShowNameInput(false);
        setShowPasskeyOptions(false);
        setPasskeyName("");
        onOpenChange(false);
      } else {
        throw new Error("Registration verification failed");
      }
    } catch (error) {
      console.error("Passkey registration error:", error);
      setIsLoading(false);
    }
  };

  const handleCreateAccount = () => {
    setShowNameInput(true);
    setPasskeyName("");
  };

  const handleNameSubmit = () => {
    if (passkeyName.trim()) {
      handlePasskeyRegister(passkeyName.trim());
    }
  };

  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowPasskeyOptions(false);
      setShowNameInput(false);
      setPasskeyName("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader
          icon={
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              {showNameInput || showPasskeyOptions ? (
                <PiFingerprint className="h-[30px] w-[30px] text-gray-400" />
              ) : (
                <PiSignIn className="h-[30px] w-[30px] text-gray-400" />
              )}
            </div>
          }
        >
          <Typography variant="heading" level={3}>
            {showNameInput
              ? dictionary.auth.create_passkey_name
              : showPasskeyOptions
                ? dictionary.auth.sign_in_with_passkey
                : dictionary.common.sign_in}
          </Typography>
        </AlertDialogHeader>
        {!showNameInput && !showPasskeyOptions && (
          <AlertDialogDescription>
            <Typography variant="body" className="text-gray-500">
              {dictionary.auth.choose_method}
            </Typography>
          </AlertDialogDescription>
        )}
        {showNameInput ? (
          <>
            <AlertDialogDescription>
              <Typography variant="body" className="text-gray-500 mb-4">
                {dictionary.auth.passkey_name_description}
              </Typography>
              <Input
                variant="floating-label"
                label={dictionary.auth.passkey_name}
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && passkeyName.trim()) {
                    handleNameSubmit();
                  }
                }}
                onFocus={(e) => {
                  // Scroll into view when focused to ensure it's not behind keyboard
                  // Use multiple attempts to handle keyboard animation and layout shifts
                  const scrollInput = () => {
                    const input = e.target as HTMLInputElement;
                    // Try scrolling the input itself
                    input.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  };

                  // First attempt after a short delay
                  setTimeout(scrollInput, 100);

                  // Second attempt after keyboard animation completes
                  setTimeout(scrollInput, 400);

                  // Final attempt after layout stabilizes
                  setTimeout(scrollInput, 600);
                }}
                autoFocus
              />
            </AlertDialogDescription>
            <AlertDialogFooter>
              <Button
                fullWidth
                onClick={handleNameSubmit}
                disabled={isLoading || !passkeyName.trim()}
              >
                {isLoading
                  ? dictionary.common.processing
                  : dictionary.common.continue}
              </Button>
            </AlertDialogFooter>
          </>
        ) : showPasskeyOptions ? (
          <AlertDialogDescription>
            <Typography variant="body" className="text-gray-500">
              {dictionary.auth.sign_in_or_create}
            </Typography>
          </AlertDialogDescription>
        ) : null}
        {showNameInput ? null : showPasskeyOptions ? (
          <AlertDialogFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                fullWidth
                onClick={handlePasskeySignIn}
                disabled={isLoading}
                className="flex items-center justify-center gap-2"
              >
                {isLoading
                  ? dictionary.common.processing
                  : dictionary.common.sign_in}
              </Button>
              <Button
                fullWidth
                onClick={handleCreateAccount}
                disabled={isLoading}
                variant="tertiary"
                className="flex items-center justify-center gap-2"
              >
                {dictionary.auth.create_account}
              </Button>
            </div>
          </AlertDialogFooter>
        ) : (
          <AlertDialogFooter>
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              <Button
                fullWidth
                onClick={handleUseBiometrics}
                disabled={isLoading}
                className="flex items-center justify-center gap-2"
              >
                <PiFingerprint className="size-5 text-white" />
                {isLoading
                  ? dictionary.common.processing
                  : dictionary.auth.sign_in_with_passkey}
              </Button>
              <Button
                fullWidth
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex items-center justify-center gap-2"
              >
                {dictionary.auth.sign_in_with_google}
              </Button>
            </div>
          </AlertDialogFooter>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
