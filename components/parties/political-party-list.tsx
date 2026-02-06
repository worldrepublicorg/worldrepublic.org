"use client";

import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTitle,
  Input,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { FocusEvent as ReactFocusEvent } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { PiShareNetwork } from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

// Lazy load heavy dialog component
const SignInDialog = dynamic(
  () =>
    import("@/components/auth/sign-in-dialog").then((mod) => mod.SignInDialog),
  { ssr: false },
);

import { CustomDrawerHeader } from "@/components/parties/custom-drawer-header";
import { ConfirmRegisterPartyDialog } from "@/components/parties/dialogs/confirm-register-party-dialog";
import { CreateUpdatePartyDialog } from "@/components/parties/dialogs/create-update-party-dialog";
import { DeletePartyDialog } from "@/components/parties/dialogs/delete-party-dialog";
import { MyPartySection } from "@/components/parties/my-party-section";
import { PartyCard } from "@/components/parties/party-card";
import { PartyDetailContent } from "@/components/parties/party-detail-content";
import { ScrollToTopButton } from "@/components/parties/scroll-to-top-button";
import { useAuth } from "@/hooks/use-auth";
import {
  createParty as createPartyAction,
  deleteParty as deletePartyAction,
  getParties,
  getUserParty,
  updateParty as updatePartyAction,
} from "@/lib/actions/parties";
import type { CreatePartyData, Party } from "@/lib/types/parties";

interface PoliticalPartyListProps {
  initialParties: Party[] | null; // Parties fetched at page level (null = error)
  dictionary: Dictionary; // All translations passed from server
  lang: string; // Language code from URL
}

export function PoliticalPartyList({
  initialParties,
  dictionary,
  lang,
}: PoliticalPartyListProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();

  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    showSignInDialog,
    setShowSignInDialog,
  } = useAuth();
  const { toast } = useToast();

  // State
  const [parties, setParties] = useState<Party[]>(initialParties || []);
  // Initialize userParty from localStorage cache for instant display
  const [userParty, setUserPartyState] = useState<Party | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("userParty");
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      if ("checked" in parsed && "party" in parsed) {
        return parsed.party;
      }
      return null;
    } catch {
      return null;
    }
  });
  // Only show loading if we don't have cached data (check for checked flag)
  const [isLoadingUserParty, setIsLoadingUserParty] = useState(() => {
    if (typeof window === "undefined") return true;
    const cached = localStorage.getItem("userParty");
    if (!cached) return true;

    try {
      const parsed = JSON.parse(cached);
      // If we have checked flag, we already know the result - no loading
      return !("checked" in parsed && "party" in parsed);
    } catch {
      return true;
    }
  });

  // Helper to update userParty state and localStorage cache
  const setUserParty = (party: Party | null) => {
    setUserPartyState(party);
    localStorage.setItem("userParty", JSON.stringify({ checked: true, party }));
  };
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [displayCount, setDisplayCount] = useState<number>(20);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreParties, setHasMoreParties] = useState(
    (initialParties?.length || 0) >= 100,
  ); // Assume more available if we got 100
  const [partiesOffset, setPartiesOffset] = useState(
    initialParties?.length || 0,
  ); // Track current offset for pagination
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterPartyDialogOpen, setIsRegisterPartyDialogOpen] =
    useState(false);
  const [selectedPartyForDrawer, setSelectedPartyForDrawer] =
    useState<Party | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form states
  const [createPartyForm, setCreatePartyForm] = useState<CreatePartyData>({
    name: "",
    description: "",
    websiteUrl: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [updatePartyForm, setUpdatePartyForm] = useState<CreatePartyData>({
    name: "",
    description: "",
    websiteUrl: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // State preservation for authentication flow
  const [pendingPartyForm, setPendingPartyForm] =
    useState<CreatePartyData | null>(null);
  const [
    shouldOpenRegisterDialogAfterAuth,
    setShouldOpenRegisterDialogAfterAuth,
  ] = useState(false);

  // Sync parties from props when they change
  useEffect(() => {
    if (initialParties !== undefined && initialParties !== null) {
      setParties(initialParties);
    }
  }, [initialParties]);

  // Fetch user party client-side when authenticated (with localStorage cache)
  useEffect(() => {
    const fetchUserPartyData = async () => {
      if (!authLoading && isAuthenticated) {
        // Check if we've already checked (have cached result, even if null)
        const hasChecked = (() => {
          if (typeof window === "undefined") return false;
          try {
            const cached = localStorage.getItem("userParty");
            if (!cached) return false;
            const parsed = JSON.parse(cached);
            return "checked" in parsed && "party" in parsed;
          } catch {
            return false;
          }
        })();

        // Only show loading if we haven't checked yet
        if (!hasChecked) {
          setIsLoadingUserParty(true);
        }

        try {
          const party = await getUserParty();
          setUserParty(party);
        } catch (error) {
          console.error(
            "[PoliticalPartyList] Error fetching user party:",
            error,
          );
          // Don't clear cached data on error - show stale data
        } finally {
          setIsLoadingUserParty(false);
        }
      } else if (!authLoading && !isAuthenticated) {
        setUserParty(null);
        setIsLoadingUserParty(false);
      }
    };

    fetchUserPartyData();
  }, [isAuthenticated, authLoading]);

  // Track whether we pushed a drawer state to history
  // This prevents cleanup from interfering with Next.js router navigation
  const drawerStatePushedRef = useRef(false);

  // Handle Android back button for drawer
  useEffect(() => {
    if (!isDrawerOpen) {
      // Reset ref when drawer closes normally (not via back button)
      drawerStatePushedRef.current = false;
      return;
    }

    // Push a state to history when drawer opens
    const state = { drawerOpen: true };
    window.history.pushState(state, "");
    drawerStatePushedRef.current = true;

    // Handle back button press
    const handlePopState = () => {
      // Close the drawer instead of navigating back
      setIsDrawerOpen(false);
      // Prevent default navigation by pushing state back
      // Note: We keep ref as true since we're pushing state back
      window.history.pushState(state, "");
      // Ref stays true - will be reset when effect cleanup runs
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);

      // Only clean up history if WE pushed a state, not based on current history state
      // This prevents interference with Next.js router navigation
      if (drawerStatePushedRef.current) {
        const currentPath = window.location.pathname;
        // Only manipulate history if we're still on the parties page
        // If Next.js router has already navigated away, don't interfere
        if (currentPath.includes("/parties")) {
          // Use replaceState to clear our state without triggering navigation
          window.history.replaceState(null, "");
        }
        drawerStatePushedRef.current = false;
      }
    };
  }, [isDrawerOpen]);

  // Load more parties when scrolling near bottom
  const loadMoreParties = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      if (hasMoreParties) {
        const limit = 100;
        const moreParties = await getParties({
          limit,
          offset: partiesOffset,
        });
        if (moreParties === null) {
          // If fetch failed, we can't do much in infinite scroll except stop loading
          setIsLoadingMore(false);
          return;
        }
        if (moreParties.length === 0) {
          setHasMoreParties(false);
        } else {
          setParties((prev) => [...prev, ...moreParties]);
          setPartiesOffset((prev) => prev + moreParties.length);
          // If we got fewer than requested, there are no more
          if (moreParties.length < limit) {
            setHasMoreParties(false);
          }
        }
      }
    } catch (error) {
      console.error("[PoliticalPartyList] Error loading more parties:", error);
      setHasMoreParties(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Infinite scroll setup
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore) {
          // Increase display count
          setDisplayCount((prevCount) => {
            const newCount = prevCount + 20;
            // Check if we need to load more parties
            const currentParties = parties;
            if (newCount >= currentParties.length - 10 && hasMoreParties) {
              loadMoreParties();
            } else if (newCount >= currentParties.length) {
              // No more parties to show
              setHasMoreParties(false);
            }
            return newCount;
          });
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoadingMore, parties, hasMoreParties, loadMoreParties]);

  // Reset display count and hasMore flags when search changes
  useEffect(() => {
    setDisplayCount(20);
    setHasMoreParties(true);
  }, [searchTerm]);

  // Scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300;
      setShowScrollToTop(shouldShow);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Helper functions
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const shortenUrl = (url: string, maxLength = 64) => {
    if (!url) return "";
    try {
      let cleanUrl = url.replace(/^https?:\/\//, "");
      cleanUrl = cleanUrl.replace(/^www\./, "");
      cleanUrl = cleanUrl.replace(/\/$/, "");
      if (cleanUrl.length <= maxLength) return cleanUrl;
      return cleanUrl.substring(0, maxLength - 3) + "...";
    } catch {
      return url;
    }
  };

  // Party actions

  const handleCreateParty = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user?.id) {
      // Save the current form state and dialog state
      setPendingPartyForm(createPartyForm);
      setShouldOpenRegisterDialogAfterAuth(false);
      // Close the create dialog
      setIsCreateDialogOpen(false);
      // Open sign-in dialog
      setShowSignInDialog(true);
      return;
    }

    if (userParty) {
      setIsCreateDialogOpen(false);
      setIsRegisterPartyDialogOpen(true);
      return;
    }

    await executeCreateParty();
  };

  // Internal function to actually create the party (without auth check)
  const performCreateParty = async (formData: CreatePartyData) => {
    if (!user?.id) return;

    try {
      setIsCreating(true);
      const result = await createPartyAction(formData);
      if (result.success) {
        toast.success({
          title: dictionary.toasts.parties.registered,
        });
        setIsCreateDialogOpen(false);
        setIsRegisterPartyDialogOpen(false);
        setCreatePartyForm({
          name: "",
          description: "",
          websiteUrl: "",
        });
        // Clear pending state
        setPendingPartyForm(null);
        setShouldOpenRegisterDialogAfterAuth(false);
        // Refresh data
        const allParties = await getParties({ limit: 100 });
        if (allParties !== null) {
          setParties(allParties);
          setPartiesOffset(allParties.length);
          setHasMoreParties(allParties.length >= 100);
        }
        if (user?.id) {
          const party = await getUserParty();
          setUserParty(party);
        }
        // Refresh profile to update partyId
        router.refresh();
      } else {
        toast.error({
          title: result.error || dictionary.toasts.parties.register_failed,
        });
      }
    } catch (error) {
      console.error("Error creating party:", error);
      toast.error({
        title: dictionary.toasts.parties.register_error,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const executeCreateParty = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user?.id) {
      // Save the current form state and dialog state
      setPendingPartyForm(createPartyForm);
      setShouldOpenRegisterDialogAfterAuth(true);
      // Close the found party dialog
      setIsRegisterPartyDialogOpen(false);
      // Open sign-in dialog
      setShowSignInDialog(true);
      return;
    }

    // User is authenticated, proceed with party creation
    // The dialog will be closed in performCreateParty on success
    await performCreateParty(createPartyForm);
  };

  // Restore state after successful authentication
  useEffect(() => {
    if (isAuthenticated && pendingPartyForm && user?.id) {
      // Restore the form data
      setCreatePartyForm(pendingPartyForm);

      if (shouldOpenRegisterDialogAfterAuth) {
        // User was in the found party dialog flow
        // Check if user has a party - if so, open found dialog, otherwise proceed directly
        getUserParty().then((party) => {
          if (party) {
            setUserParty(party);
            setIsRegisterPartyDialogOpen(true);
          } else {
            // No existing party, proceed directly to create
            performCreateParty(pendingPartyForm);
          }
          // Clear pending state
          setPendingPartyForm(null);
          setShouldOpenRegisterDialogAfterAuth(false);
        });
      } else {
        // User was in the create party dialog flow
        // Reopen the create dialog with the saved form data
        setIsCreateDialogOpen(true);
        // Clear pending state
        setPendingPartyForm(null);
        setShouldOpenRegisterDialogAfterAuth(false);
      }
    }
  }, [
    isAuthenticated,
    pendingPartyForm,
    shouldOpenRegisterDialogAfterAuth,
    user?.id,
    performCreateParty,
  ]);

  const handleUpdatePartyAll = async () => {
    if (!selectedParty || !user?.id) return;

    try {
      setIsProcessing(true);
      const result = await updatePartyAction(selectedParty.id, updatePartyForm);
      if (result.success) {
        toast.success({
          title: dictionary.toasts.parties.updated,
        });
        setIsUpdateDialogOpen(false);
        // Refresh data
        const allParties = await getParties({ limit: 100 });
        if (allParties !== null) {
          setParties(allParties);
          setPartiesOffset(allParties.length);
          setHasMoreParties(allParties.length >= 100);
        }
        if (user?.id) {
          const party = await getUserParty();
          setUserParty(party);
        }
      } else {
        toast.error({
          title: result.error || dictionary.toasts.parties.update_failed,
        });
      }
    } catch (error) {
      console.error("Error updating party:", error);
      toast.error({
        title: dictionary.toasts.parties.update_error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteParty = async () => {
    if (!selectedParty || !user?.id) return;

    try {
      setIsProcessing(true);
      const result = await deletePartyAction(selectedParty.id);
      if (result.success) {
        toast.success({
          title: dictionary.toasts.parties.deleted,
        });
        setIsDeleteDialogOpen(false);
        setUserParty(null);
        // Refresh data
        const allParties = await getParties({ limit: 100 });
        if (allParties !== null) {
          setParties(allParties);
          setPartiesOffset(allParties.length);
          setHasMoreParties(allParties.length >= 100);
        }
      } else {
        toast.error({
          title: result.error || dictionary.toasts.parties.delete_failed,
        });
      }
    } catch (error) {
      console.error("Error deleting party:", error);
      toast.error({
        title: dictionary.toasts.parties.delete_error,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openUpdatePartyDialog = (party: Party) => {
    setSelectedParty(party);
    setUpdatePartyForm({
      name: party.name,
      description: party.description,
      websiteUrl: party.websiteUrl || "",
    });
    setIsUpdateDialogOpen(true);
  };

  const handleInputFocus = (e: ReactFocusEvent) => {
    if (
      e.target &&
      (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement)
    ) {
      setTimeout(() => {
        (e.target as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Filter parties based on search term
  const filteredParties =
    searchTerm.trim() === ""
      ? parties
      : parties.filter(
          (party) =>
            party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (party.description
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ??
              false),
        );

  // Get only the parties to display based on the current display count
  const partiesToDisplay = filteredParties.slice(0, displayCount);

  // Check if user is leader (founder) of the party
  // Note: We compare userParty?.id with party.id to check if user founded this party
  const isUserLeader = (party: Party) => {
    if (!userParty) return false;
    return userParty.id === party.id;
  };

  return (
    <div className="w-full overflow-x-hidden">
      {/* My Party Section */}
      <MyPartySection
        userParty={userParty}
        isLoading={isLoadingUserParty}
        isUserLeader={(party) => Boolean(isUserLeader(party))}
        shortenUrl={shortenUrl}
        dictionary={dictionary}
        lang={lang}
        onCreateParty={() => setIsCreateDialogOpen(true)}
        onOpenDrawer={(party) => {
          setSelectedPartyForDrawer(party);
          setIsDrawerOpen(true);
        }}
        onEditParty={openUpdatePartyDialog}
        onDeleteParty={() => {
          setSelectedParty(userParty);
          setIsDeleteDialogOpen(true);
        }}
      />

      <Typography
        variant="subtitle"
        level={1}
        className="mb-3! text-[19px] font-semibold px-6"
      >
        {dictionary.pages.govern.parties.discover}
      </Typography>

      {/* Search bar */}
      <div className="mb-5 h-12.5 px-6">
        <Input
          type="text"
          startAdornment={
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
          }
          label={dictionary.pages.govern.parties.search_placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleInputFocus}
        />
      </div>

      {/* Parties list */}
      <div className="px-6 pb-6">
        {initialParties === null ? (
          // Error state (only when initial load failed)
          <div className="mt-12 mb-8 flex flex-col items-center gap-3 p-4 text-center">
            <Typography
              variant="body"
              level={3}
              className="text-sm text-gray-500"
            >
              {dictionary.pages.govern.parties.error_loading}
            </Typography>
            <Button
              variant="tertiary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing
                ? dictionary.common.loading
                : dictionary.pages.govern.parties.refresh}
            </Button>
          </div>
        ) : filteredParties.length === 0 ? (
          // Search filter - no results match
          <div className="mt-12 mb-8 text-center text-sm text-gray-500">
            {dictionary.pages.govern.parties.no_parties_found}
          </div>
        ) : (
          <>
            {partiesToDisplay.map((party, index) => (
              <PartyCard
                key={party.id}
                party={party}
                isUserLeader={(party) => Boolean(isUserLeader(party))}
                shortenUrl={shortenUrl}
                onOpenDrawer={(party) => {
                  setSelectedPartyForDrawer(party);
                  setIsDrawerOpen(true);
                }}
                onEditParty={openUpdatePartyDialog}
                onDeleteParty={() => {
                  setSelectedParty(party);
                  setIsDeleteDialogOpen(true);
                }}
                isLastItem={index === partiesToDisplay.length - 1}
                dictionary={dictionary}
              />
            ))}

            {filteredParties.length > displayCount && (
              <div ref={loadMoreRef} className="h-14 py-4" />
            )}
          </>
        )}
      </div>

      {/* Create Party Dialog */}
      <CreateUpdatePartyDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        mode="create"
        formData={createPartyForm}
        onFormDataChange={setCreatePartyForm}
        onConfirm={handleCreateParty}
        isProcessing={isCreating}
        onInputFocus={handleInputFocus}
        isAuthenticated={isAuthenticated}
        onSignInRequired={() => {
          // Save the current form state
          setPendingPartyForm(createPartyForm);
          setShouldOpenRegisterDialogAfterAuth(false);
          // Close the create dialog
          setIsCreateDialogOpen(false);
          // Open sign-in dialog
          setShowSignInDialog(true);
        }}
        dictionary={dictionary}
      />

      {/* Update Party Dialog */}
      <CreateUpdatePartyDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        mode="update"
        formData={updatePartyForm}
        onFormDataChange={setUpdatePartyForm}
        onConfirm={handleUpdatePartyAll}
        isProcessing={isProcessing}
        onInputFocus={handleInputFocus}
        dictionary={dictionary}
      />

      {/* Confirm Register Party Dialog */}
      <ConfirmRegisterPartyDialog
        open={isRegisterPartyDialogOpen}
        onOpenChange={setIsRegisterPartyDialogOpen}
        userParty={userParty}
        onConfirm={executeCreateParty}
        isProcessing={isCreating}
        dictionary={dictionary}
      />

      {/* Delete Party Dialog */}
      <DeletePartyDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        party={selectedParty}
        onConfirm={handleDeleteParty}
        isProcessing={isProcessing}
        dictionary={dictionary}
      />

      {/* Sign-in dialog */}
      <SignInDialog
        open={showSignInDialog}
        onOpenChange={setShowSignInDialog}
        dictionary={dictionary}
      />

      {/* Scroll to top button */}
      <ScrollToTopButton show={showScrollToTop} onClick={scrollToTop} />

      {/* Party Detail Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="flex flex-col">
          <div className="shrink-0 px-6 pt-6">
            <CustomDrawerHeader
              icon={
                selectedPartyForDrawer && (
                  <button
                    onClick={async () => {
                      const shareUrl = `${window.location.origin}/parties/${selectedPartyForDrawer.id}`;
                      const shareTitle = selectedPartyForDrawer.name;

                      // Check if Web Share API is supported
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: shareTitle,
                            url: shareUrl,
                          });
                        } catch (error) {
                          // User cancelled or share failed - fallback to clipboard
                          if (
                            error instanceof Error &&
                            error.name !== "AbortError"
                          ) {
                            await navigator.clipboard.writeText(shareUrl);
                            toast.success({
                              title: dictionary.toasts.copied,
                            });
                          }
                        }
                      } else {
                        // Fallback for browsers that don't support Web Share API
                        await navigator.clipboard.writeText(shareUrl);
                        toast.success({
                          title: dictionary.toasts.copied,
                        });
                      }
                    }}
                    className="flex size-10 items-center justify-center rounded-full bg-gray-100"
                    aria-label={dictionary.pages.govern.parties.share_party}
                  >
                    <PiShareNetwork className="size-4 text-gray-900" />
                  </button>
                )
              }
            >
              <DrawerTitle>
                {dictionary.pages.govern.parties.party_details}
              </DrawerTitle>
            </CustomDrawerHeader>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {selectedPartyForDrawer && (
              <PartyDetailContent
                partyId={selectedPartyForDrawer.id}
                dictionary={dictionary}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
