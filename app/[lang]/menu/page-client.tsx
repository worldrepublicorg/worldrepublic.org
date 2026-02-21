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
  Typography,
  useToast,
} from "@worldcoin/mini-apps-ui-kit-react";
import { useRouter } from "next/navigation";
import { signOut as nextAuthSignOut } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  PiArrowSquareOut,
  PiBookOpenText,
  PiFileText,
  PiGithubLogo,
  PiGlobe,
  PiLifebuoy,
  PiRocketLaunch,
  PiShieldCheck,
  PiSignIn,
  PiSignOut,
  PiSignOutFill,
  PiUserCircle,
  PiX,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";
import { CustomListItem } from "@/components/custom-list-item";
import { MenuPageSkeleton } from "@/components/menu/menu-page-skeleton";
import { SignInDialog } from "@/components/sign-in-dialog";
import { TopBar } from "@/components/topbar";
import { getWalletAuthAndData } from "@/lib/actions/member";
import {
  getCachedWalletData,
  setCachedWalletData,
} from "@/lib/wallet-auth-cache";

interface MenuPageClientProps {
  lang: string;
  dictionary: Dictionary;
}

export default function MenuPageClient({
  lang,
  dictionary,
}: MenuPageClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showSignInDialog, setShowSignInDialog] = useState(false);

  const [cachedData] = useState(() => getCachedWalletData());
  const [serverAuth, setServerAuth] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getWalletAuthAndData().then((result) => {
      if (cancelled) return;
      setServerAuth(result.authenticated);
      setCachedWalletData(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showSkeleton = serverAuth === null && cachedData === null;
  const isAuthenticated = serverAuth ?? cachedData?.authenticated ?? false;

  const handleClose = () => {
    // Check if there's a stored return URL
    const returnUrl = localStorage.getItem("menuReturnUrl");
    if (returnUrl) {
      // Navigate to the stored return URL
      router.push(returnUrl);
      // Clear the stored URL after using it
      localStorage.removeItem("menuReturnUrl");
    } else {
      // Default to root page
      router.push(`/${lang}/`);
    }
  };

  const handleSignOut = async () => {
    try {
      setCachedWalletData({
        authenticated: false,
        profileData: null,
        transactions: null,
        email: null,
      });
      await nextAuthSignOut({
        redirect: false,
      });
      window.location.href = `/${lang}/`;
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error({
        title: dictionary.toasts.wallet.sign_out_failed,
      });
      window.location.href = `/${lang}/`;
    }
  };

  const menuSections = [
    {
      title: dictionary.pages.menu.sections.account.title,
      links: [
        ...(isAuthenticated
          ? [
              {
                label: dictionary.pages.menu.sections.account.account_info,
                url: "/menu/account",
                isExternal: false,
                startAdornment: (
                  <PiUserCircle className="size-5 text-gray-400" />
                ),
              },
            ]
          : [
              {
                label: dictionary.common.sign_in,
                url: "#",
                isExternal: false,
                startAdornment: <PiSignIn className="size-5 text-gray-400" />,
                onClick: () => setShowSignInDialog(true),
              },
            ]),
        {
          label: dictionary.pages.menu.sections.account.language,
          url: "/menu/language",
          isExternal: false,
          startAdornment: <PiGlobe className="size-5 text-gray-400" />,
        },
      ],
    },
    {
      title: dictionary.pages.menu.sections.help.title,
      links: [
        {
          label: dictionary.pages.menu.sections.help.quickstart,
          url: "https://wiki.worldrepublic.org/quickstart",
          isExternal: true,
          startAdornment: <PiRocketLaunch className="size-5 text-gray-400" />,
        },
        {
          label: dictionary.pages.menu.sections.help.docs,
          url: "https://wiki.worldrepublic.org/",
          isExternal: true,
          startAdornment: <PiBookOpenText className="size-5 text-gray-400" />,
        },
        {
          label: dictionary.pages.menu.sections.help.help_center,
          url: "https://wiki.worldrepublic.org/help-center",
          isExternal: true,
          startAdornment: <PiLifebuoy className="size-5 text-gray-400" />,
        },
      ],
    },
    {
      title: dictionary.pages.menu.sections.source_code.title,
      links: [
        {
          label: "GitHub",
          url: "https://github.com/worldrepublicorg",
          isExternal: true,
          startAdornment: <PiGithubLogo className="size-5 text-gray-400" />,
        },
      ],
    },
    {
      title: dictionary.pages.menu.sections.legal.title,
      links: [
        {
          label: dictionary.pages.menu.sections.legal.terms,
          url: `/menu/terms`,
          isExternal: false,
          startAdornment: <PiFileText className="size-5 text-gray-400" />,
        },
        {
          label: dictionary.pages.menu.sections.legal.privacy,
          url: `/menu/privacy`,
          isExternal: false,
          startAdornment: <PiShieldCheck className="size-5 text-gray-400" />,
        },
      ],
    },
  ];

  if (showSkeleton) {
    return <MenuPageSkeleton />;
  }

  return (
    <div className="pb-safe flex min-h-dvh flex-col">
      <TopBar
        title={dictionary.nav.menu}
        startAdornment={<div className="size-10" />}
        endAdornment={
          <button
            onClick={handleClose}
            className="flex size-10 items-center justify-center rounded-full bg-gray-100"
          >
            <PiX className="size-4 text-gray-900" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="flex flex-col gap-8">
          {menuSections.map((section, index) => (
            <div key={index}>
              <div className="mb-4 flex">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="text-gray-400"
                >
                  {section.title}
                </Typography>
              </div>

              <div className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <div key={link.url} className="flex">
                    {"onClick" in link && link.onClick ? (
                      <div
                        onClick={link.onClick}
                        className="block w-full cursor-pointer"
                      >
                        <CustomListItem
                          startAdornment={link.startAdornment}
                          label={link.label}
                        />
                      </div>
                    ) : link.isExternal ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <CustomListItem
                          startAdornment={link.startAdornment}
                          label={link.label}
                          endAdornment={
                            <PiArrowSquareOut className="size-4 text-gray-400" />
                          }
                        />
                      </a>
                    ) : (
                      <CustomListItem
                        startAdornment={link.startAdornment}
                        label={link.label}
                        href={`/${lang}${link.url}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {isAuthenticated && (
            <div>
              <div className="mb-4 flex">
                <Typography
                  variant="subtitle"
                  level={3}
                  className="text-gray-400"
                >
                  {dictionary.common.sign_out.toUpperCase()}
                </Typography>
              </div>
              <div className="flex flex-col gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div className="cursor-pointer">
                      <CustomListItem
                        label={dictionary.common.sign_out}
                        startAdornment={
                          <PiSignOut className="size-5 text-gray-400" />
                        }
                      />
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader
                      icon={
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                          <PiSignOutFill className="h-[30px] w-[30px] text-gray-400" />
                        </div>
                      }
                    >
                      <Typography variant="heading" level={3}>
                        {dictionary.common.sign_out}
                      </Typography>
                    </AlertDialogHeader>
                    <AlertDialogDescription>
                      {dictionary.pages.wallet.modals.sign_out.confirm}
                    </AlertDialogDescription>
                    <AlertDialogFooter>
                      <AlertDialogClose asChild>
                        <Button
                          onClick={async () => {
                            await handleSignOut();
                          }}
                          className="w-full"
                        >
                          {dictionary.common.sign_out}
                        </Button>
                      </AlertDialogClose>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sign-in dialog */}
      <SignInDialog
        open={showSignInDialog}
        onOpenChange={setShowSignInDialog}
        dictionary={dictionary}
      />
    </div>
  );
}
