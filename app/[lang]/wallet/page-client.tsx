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
  WalletAddressField,
} from "@worldcoin/mini-apps-ui-kit-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  PiArrowCircleUpFill,
  PiArrowSquareOut,
  PiArrowsClockwise,
  PiArrowsClockwiseFill,
  PiArrowUp,
} from "react-icons/pi";
import type { Dictionary } from "@/app/[lang]/dictionaries";

// Lazy load heavy dialog component
const SignInDialog = dynamic(
  () => import("@/components/sign-in-dialog").then((mod) => mod.SignInDialog),
  { ssr: false },
);

import { CustomListItem } from "@/components/custom-list-item";
import { CustomSelect } from "@/components/custom-select";
import { MenuLink } from "@/components/menu-link";
import { TopBar } from "@/components/topbar";
import { TransactionHistoryContent } from "@/components/wallet/transaction-history-content";
import { WalletPageSkeleton } from "@/components/wallet/wallet-page-skeleton";
import WddImportInfoBanner from "@/components/wdd-import-info-banner";
import { useAuth } from "@/hooks/use-auth";
import {
  type GetWalletAuthAndDataResult,
  type GetWalletAuthAndDataTransaction,
  getWalletAuthAndData,
  withdrawTokens,
} from "@/lib/actions/member";
import { formatElectionDate } from "@/lib/format-date";
import { computeWalletBalance, type StreamData } from "@/lib/streams";
import { cn, formatFullAmount, truncateToPrecision } from "@/lib/utils";
import {
  getCachedWalletData,
  setCachedWalletData,
} from "@/lib/wallet-auth-cache";

interface WalletPageClientProps {
  lang: string;
  dictionary: Dictionary;
}

export default function WalletPageClient({
  dictionary,
}: WalletPageClientProps) {
  const params = useParams<{ lang: string }>();
  const [isSignInDialogOpen, setIsSignInDialogOpen] = useState(false);
  const { user, isAuthenticated: clientIsAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [cachedData] = useState<GetWalletAuthAndDataResult | null>(
    getCachedWalletData,
  );
  const [serverData, setServerData] =
    useState<GetWalletAuthAndDataResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    const pendingReferral =
      localStorage.getItem("pending_referral") || undefined;
    getWalletAuthAndData(pendingReferral).then((result) => {
      if (cancelled) return;
      setServerData(result);
      setCachedWalletData(result);
      if (pendingReferral && result.authenticated) {
        localStorage.removeItem("pending_referral");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const data = serverData ?? cachedData;
  const showSkeleton = data === null;
  const profileData = data?.profileData ?? null;
  const isAuthenticated = data?.authenticated ?? false;
  const transactions: GetWalletAuthAndDataTransaction[] =
    data?.transactions ?? [];

  const authenticated = isAuthenticated || clientIsAuthenticated;
  const userStreams: StreamData[] = data?.streams ?? [];
  const serverBalance = profileData?.walletBalance ?? null;

  // Live-ticking balance from streams
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const streamsRef = useRef(userStreams);
  streamsRef.current = userStreams;

  const computeBalance = useCallback(() => {
    const s = streamsRef.current;
    if (s.length > 0) {
      return computeWalletBalance(s, Date.now());
    }
    return null;
  }, []);

  useEffect(() => {
    if (userStreams.length === 0) {
      setLiveBalance(null);
      return;
    }
    setLiveBalance(computeBalance());
    const interval = setInterval(() => {
      setLiveBalance(computeBalance());
    }, 1000);
    return () => clearInterval(interval);
  }, [userStreams, computeBalance]);

  const walletBalance = liveBalance ?? serverBalance;
  const locale = params.lang?.trim() || "en";

  // Stream rate line: total WDD/day and latest end date (only when user has streams)
  const streamRatePerDay =
    userStreams.length > 0
      ? userStreams.reduce((sum, s) => sum + s.ratePerSecond, 0) * 86400
      : null;
  const latestStreamEndsAt =
    userStreams.length > 0
      ? Math.max(...userStreams.map((s) => s.endsAt))
      : null;
  const formattedStreamRate =
    streamRatePerDay != null
      ? streamRatePerDay < 0.000001
        ? "<0.000001"
        : streamRatePerDay.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
      : null;

  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);

  // Helper function to get address validation error message
  const getAddressValidationError = (address: string): string | null => {
    if (!address) return null;

    // Check if address is a valid EVM address (0x followed by 40 hex characters)
    const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!evmAddressRegex.test(address)) {
      return dictionary.common.invalid_address;
    }

    // Check if the address is the token's contract address
    const tokenContractAddress = "0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b";
    if (address.toLowerCase() === tokenContractAddress.toLowerCase()) {
      return dictionary.toasts.wallet.contract_address_error;
    }

    return null;
  };

  // State for form validation
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedChain, setSelectedChain] = useState("");
  const [amount, setAmount] = useState("");

  // Handle withdraw action
  const handleWithdraw = async () => {
    if (!user?.id) {
      toast.error({
        title: dictionary.toasts.wallet.no_wallet,
      });
      return;
    }

    // Show immediate feedback that withdrawal is being initiated
    toast.success({
      title: dictionary.common.processing,
    });

    try {
      const result = await withdrawTokens(walletAddress, selectedChain, amount);

      if (result.success && result.transactionId) {
        toast.success({
          title: dictionary.toasts.wallet.sent,
        });

        // Reset form
        setSelectedChain("");
        setAmount("");

        const fresh = await getWalletAuthAndData();
        setServerData(fresh);
        setCachedWalletData(fresh);
        router.refresh();
      } else {
        toast.error({
          title: result.error || dictionary.toasts.generic_error,
        });
      }
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast.error({
        title: dictionary.toasts.generic_error,
      });
    }
  };

  const displayBalanceNumber = walletBalance || 0;
  const totalBalanceNumber = walletBalance || 0;

  const truncatedDisplay = Math.floor(displayBalanceNumber * 1e18) / 1e18;
  const safeDisplayAmount = Math.max(0, truncatedDisplay - 1e-12);
  const precision = safeDisplayAmount === 0 ? 2 : 5;
  const truncatedDisplayBalance = truncateToPrecision(
    safeDisplayAmount,
    precision,
  );
  const displayBalance = truncatedDisplayBalance.toLocaleString(locale, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  // Format send balance with small buffer only (no truncation for dialog)
  const safeSendAmount = Math.max(0, totalBalanceNumber - 1e-12);
  const maxWithdrawable = safeSendAmount;
  const totalBalance = formatFullAmount(safeSendAmount);

  // Validation checks
  const isChainSelected = selectedChain !== "";

  // Determine button state and text
  const getButtonState = () => {
    // Check if address is empty first
    if (!walletAddress.trim()) {
      return { disabled: true, text: dictionary.common.invalid_address };
    }

    // Check for address validation errors
    const addressError = getAddressValidationError(walletAddress);
    if (addressError) {
      return { disabled: true, text: addressError };
    }

    // Check if chain is selected
    if (!isChainSelected) {
      return { disabled: true, text: dictionary.common.withdraw };
    }

    const amountNum = parseFloat(amount);

    if (!amount || isNaN(amountNum)) {
      return { disabled: true, text: dictionary.common.withdraw };
    }

    if (amountNum < 10) {
      return { disabled: true, text: dictionary.toasts.wallet.min_amount };
    }

    if (amountNum > maxWithdrawable) {
      return {
        disabled: true,
        text: dictionary.common.insufficient_balance,
      };
    }

    return { disabled: false, text: dictionary.common.withdraw };
  };

  const buttonState = getButtonState();

  if (showSkeleton) {
    return <WalletPageSkeleton />;
  }

  return (
    <div className="pb-safe flex flex-col">
      <TopBar
        title={dictionary.pages.wallet.topbar.title}
        endAdornment={<MenuLink lang={params.lang} />}
      />

      <div className="flex flex-col gap-9 p-6">
        {/* WDD Balance Display */}
        <div className="flex flex-col items-center justify-center">
          <Typography
            variant="subtitle"
            level={3}
            className="text-gray-500 mt-1!"
          >
            {dictionary.pages.wallet.balance}
          </Typography>
          <Typography variant="heading" level={1} className="font-mono mt-3!">
            {displayBalance} WDD
          </Typography>
          {formattedStreamRate != null && latestStreamEndsAt != null && (
            <Typography
              variant="subtitle"
              level={4}
              className="text-gray-400 mt-1.5!"
            >
              {formattedStreamRate} WDD/day until{" "}
              {formatElectionDate(latestStreamEndsAt, locale)}
            </Typography>
          )}

          <div className="flex flex-row w-full justify-around mt-5 px-6">
            {/* Send */}
            {/* Withdraw to Crypto Dialog */}
            <AlertDialog
              open={isWithdrawDialogOpen}
              onOpenChange={(open) => {
                setIsWithdrawDialogOpen(open);
                if (!open) {
                  // Reset form when dialog closes
                  setWalletAddress("");
                  setSelectedChain("");
                  setAmount("");
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <div className="flex flex-1 flex-col items-center gap-2 cursor-pointer">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <PiArrowUp className="h-5 w-5 text-gray-900" />
                  </div>
                  <Typography
                    variant="body"
                    level={4}
                    className="text-gray-900 font-medium"
                  >
                    {dictionary.pages.wallet.modals.send.button}
                  </Typography>
                </div>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader
                  icon={
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <PiArrowCircleUpFill className="h-[30px] w-[30px] text-gray-400" />
                    </div>
                  }
                >
                  <Typography variant="heading" level={3}>
                    {dictionary.pages.wallet.modals.send.button}
                  </Typography>
                </AlertDialogHeader>

                <AlertDialogDescription className="mb-4">
                  {
                    dictionary.pages.wallet.modals.send.withdraw_to_crypto
                      .description
                  }
                </AlertDialogDescription>

                <div className="flex flex-col gap-2">
                  <WalletAddressField
                    value={walletAddress}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWalletAddress(e.target.value)
                    }
                    label={
                      dictionary.pages.wallet.modals.send.withdraw_to_crypto
                        .address_label
                    }
                  />

                  <CustomSelect
                    defaultValue=""
                    name="chain"
                    value={selectedChain}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      setSelectedChain(e.target.value)
                    }
                    aria-label={
                      dictionary.pages.wallet.modals.send.withdraw_to_crypto
                        .network_label
                    }
                    placeholder={
                      dictionary.pages.wallet.modals.send.withdraw_to_crypto
                        .network_label
                    }
                    options={[
                      { label: "Ethereum", value: "1" },
                      { label: "World Chain", value: "480" },
                    ]}
                  />

                  <Input
                    value={amount}
                    type="number"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setAmount(e.target.value);
                    }}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setAmount(totalBalance)}
                        className={cn(
                          "leading-narrow flex h-9 items-center justify-center rounded-full font-sans text-sm font-medium tracking-normal whitespace-nowrap",
                          amount === totalBalance
                            ? "text-gray-500"
                            : "text-gray-900",
                        )}
                      >
                        {dictionary.common.max}
                      </button>
                    }
                    label={
                      dictionary.pages.wallet.modals.send.withdraw_to_crypto
                        .amount_label
                    }
                    className="mb-4"
                  />
                </div>

                {/* WDD Import Info Banner */}
                <div className="mb-6">
                  <WddImportInfoBanner dictionary={dictionary} />
                </div>

                <AlertDialogFooter>
                  {buttonState.disabled ? (
                    <Button
                      onClick={handleWithdraw}
                      className="w-full"
                      disabled={true}
                    >
                      {buttonState.text}
                    </Button>
                  ) : (
                    <AlertDialogClose asChild>
                      <Button
                        onClick={handleWithdraw}
                        className="w-full"
                        disabled={false}
                      >
                        {buttonState.text}
                      </Button>
                    </AlertDialogClose>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Trade */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div className="flex flex-1 flex-col items-center gap-2 cursor-pointer">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                    <PiArrowsClockwise className="h-5 w-5 text-gray-900" />
                  </div>
                  <Typography
                    variant="body"
                    level={4}
                    className="text-gray-900 font-medium"
                  >
                    {dictionary.common.trade}
                  </Typography>
                </div>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader
                  icon={
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                      <PiArrowsClockwiseFill className="h-[30px] w-[30px] text-gray-400" />
                    </div>
                  }
                >
                  <Typography variant="heading" level={3}>
                    {dictionary.common.trade}
                  </Typography>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <div className="flex flex-col gap-2 w-full">
                    <a
                      href="https://jumper.exchange/?toChain=1&toToken=0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade.ethereum_jumper
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/jumper.svg"
                            alt="Jumper"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a>
                    <a
                      href="https://app.uniswap.org/explore/tokens/ethereum/0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade.ethereum_uniswap
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/uniswap.svg"
                            alt="Uniswap"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a>
                    <a
                      href="https://jumper.exchange/?toChain=480&toToken=0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade.worldchain_jumper
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/jumper.svg"
                            alt="Jumper"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a>
                    <a
                      href="https://app.uniswap.org/explore/tokens/worldchain/0xede54d9c024ee80c85ec0a75ed2d8774c7fbac9b"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <CustomListItem
                        label={
                          dictionary.pages.wallet.modals.trade
                            .worldchain_uniswap
                        }
                        startAdornment={
                          <Image
                            src="/icons/exchanges/uniswap.svg"
                            alt="Uniswap"
                            width={24}
                            height={24}
                            className="size-6 rounded-full"
                            priority
                          />
                        }
                        endAdornment={
                          <PiArrowSquareOut className="size-4 text-gray-400" />
                        }
                      />
                    </a>
                  </div>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div>
          <div className="mb-4 flex">
            <Typography variant="subtitle" level={3} className="text-gray-400">
              {dictionary.pages.wallet.history.title}
            </Typography>
          </div>
          <TransactionHistoryContent
            transactions={authenticated ? transactions : []}
            dictionary={dictionary}
            lang={params.lang}
          />
        </div>
      </div>

      {/* Sign-in dialog */}
      <SignInDialog
        open={isSignInDialogOpen}
        onOpenChange={setIsSignInDialogOpen}
        dictionary={dictionary}
      />
    </div>
  );
}
