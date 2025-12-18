"use client";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTrigger,
  Button,
  Input,
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  PiCaretLeft,
  PiPencilSimple,
  PiPencilSimpleFill,
  PiTrash,
  PiTrashFill,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { TopBar } from "@/components/topbar";
import { useAuth } from "@/hooks/use-auth";
import { deleteUserAccount, setUsername } from "@/lib/actions/member";

interface AccountPageClientProps {
  profileData: {
    selfVerifiedAt: number | null;
    username: string | null;
    userId: string;
    userUuid: string | null;
  } | null;
  isAuthenticated: boolean;
  lang: string;
  dictionary: Dictionary;
}

export default function AccountPageClient({
  profileData,
  isAuthenticated,
  lang,
  dictionary,
}: AccountPageClientProps) {
  const { signOut, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated: clientIsAuthenticated } = useAuth();

  const username = profileData?.username ?? null;

  // State for form validation
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [editUsernameDialogOpen, setEditUsernameDialogOpen] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const handleSignOut = async () => {
    try {
      // Disconnect wallet and sign out from NextAuth
      await signOut();

      // Simple redirect - always redirect to root page
      window.location.href = `/${lang}/`;
    } catch (error) {
      console.error("Error signing out:", error);

      // Show error message
      toast.error({
        title: dictionary.toasts.wallet.sign_out_failed,
      });

      // Still redirect even if there was an error
      window.location.href = `/${lang}/`;
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) {
      toast.error({
        title: dictionary.toasts.wallet.no_wallet,
      });
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteUserAccount(user.id);

      if (result.success) {
        toast.success({
          title: dictionary.toasts.wallet.account_deleted,
        });

        // Sign out and redirect to earn page
        await handleSignOut();
      } else {
        toast.error({
          title: result.error || dictionary.toasts.wallet.delete_failed,
        });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error({
        title: dictionary.toasts.wallet.delete_failed,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const authenticated = isAuthenticated || clientIsAuthenticated;

  return (
    <div className="pb-safe flex flex-col">
      {!authenticated ? (
        <TopBar
          title={dictionary.pages.menu.sections.account.account_info}
          startAdornment={
            <button
              onClick={() => router.back()}
              className="flex size-10 items-center justify-center rounded-full bg-gray-100"
            >
              <PiCaretLeft className="size-4 text-gray-900" />
            </button>
          }
        />
      ) : (
        <>
          <TopBar
            title={dictionary.pages.menu.sections.account.account_info}
            startAdornment={
              <button
                onClick={() => router.back()}
                className="flex size-10 items-center justify-center rounded-full bg-gray-100"
              >
                <PiCaretLeft className="size-4 text-gray-900" />
              </button>
            }
          />

          <div className="flex flex-col gap-8 p-6">
            <div>
              <div className="mb-4 flex">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="text-gray-400"
                >
                  {dictionary.pages.wallet.sections.account}
                </Typography>
              </div>
              <div className="flex flex-col gap-2">
                {user?.email && (
                  <div>
                    <CustomListItem
                      label={
                        dictionary.pages.menu.sections.account.account_info
                      }
                      description={user.email}
                    />
                  </div>
                )}
                {username && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditUsernameValue(username);
                      setEditUsernameDialogOpen(true);
                    }}
                  >
                    <CustomListItem
                      label={dictionary.pages.wallet.username.label}
                      description={username}
                      endAdornment={
                        <PiPencilSimple className="size-4 text-gray-400" />
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mb-4 flex">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="text-gray-400"
                >
                  {dictionary.pages.wallet.sections.danger_zone}
                </Typography>
              </div>
              <div className="flex flex-col gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="cursor-pointer">
                      <CustomListItem
                        label={dictionary.common.delete_account}
                        description={
                          dictionary.pages.wallet.sections.delete_account
                            .description
                        }
                        endAdornment={
                          <PiTrash className="size-4 text-gray-400" />
                        }
                      />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader
                      icon={
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                          <PiTrashFill className="h-[30px] w-[30px] text-gray-400" />
                        </div>
                      }
                    >
                      <Typography variant="heading" level={3}>
                        {dictionary.common.delete_account}
                      </Typography>
                    </AlertDialogHeader>

                    <AlertDialogDescription>
                      {
                        dictionary.pages.wallet.modals.delete_account
                          .description
                      }
                    </AlertDialogDescription>

                    <AlertDialogFooter>
                      <AlertDialogClose asChild>
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount}
                          className="w-full bg-red-500! text-white!"
                        >
                          {isDeletingAccount
                            ? dictionary.pages.wallet.modals.delete_account
                                .deleting
                            : dictionary.common.delete_account}
                        </Button>
                      </AlertDialogClose>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Username Dialog */}
      <AlertDialog
        open={editUsernameDialogOpen}
        onOpenChange={setEditUsernameDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader
            icon={
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <PiPencilSimpleFill className="h-[30px] w-[30px] text-gray-400" />
              </div>
            }
          >
            <Typography variant="heading" level={3}>
              {dictionary.pages.wallet.username.edit_title}
            </Typography>
          </AlertDialogHeader>
          <AlertDialogDescription>
            <div className="space-y-4">
              <div>
                <Input
                  label={dictionary.pages.wallet.username.label}
                  value={editUsernameValue}
                  onChange={(e) => setEditUsernameValue(e.target.value)}
                  disabled={isUpdatingUsername}
                />
                <Typography
                  variant="body"
                  level={4}
                  className="mt-1! text-gray-500"
                >
                  {dictionary.pages.wallet.username.description}
                </Typography>
              </div>
            </div>
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              onClick={async () => {
                setIsUpdatingUsername(true);
                try {
                  const result = await setUsername(editUsernameValue.trim());
                  if (result.success) {
                    toast.success({
                      title: dictionary.toasts.parties.updated,
                    });
                    setEditUsernameDialogOpen(false);
                    setEditUsernameValue("");
                    router.refresh();
                  } else {
                    toast.error({
                      title:
                        result.error || dictionary.toasts.parties.update_failed,
                    });
                  }
                } catch (error) {
                  console.error("Error updating username:", error);
                  toast.error({
                    title: dictionary.toasts.parties.update_failed,
                  });
                } finally {
                  setIsUpdatingUsername(false);
                }
              }}
              disabled={isUpdatingUsername || !editUsernameValue.trim()}
            >
              {isUpdatingUsername
                ? dictionary.common.updating
                : dictionary.common.save}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
