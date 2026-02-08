"use client";

import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { useState } from "react";

export function useAuth() {
  const { data, status } = useSession();
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const handleSignIn = () => {
    if (data) {
      nextAuthSignOut({ redirect: false }).then(() => {
        setTimeout(() => {
          setShowSignInDialog(true);
        }, 100);
      });
    } else {
      setShowSignInDialog(true);
    }
  };

  const handleSignOut = async () => {
    try {
      // Clear cached user data
      localStorage.removeItem("userParty");

      await nextAuthSignOut({
        redirect: false,
      });
    } catch (error) {
      console.error("Failed to sign out:", error);
      throw error;
    }
  };

  return {
    // Session data from NextAuth
    session: data,
    isAuthenticated: !!data,
    isLoading: status === "loading",
    status,
    user: data?.user,

    // Actions
    signIn: handleSignIn,
    signOut: handleSignOut,

    // Dialog state
    showSignInDialog,
    setShowSignInDialog,
  };
}
