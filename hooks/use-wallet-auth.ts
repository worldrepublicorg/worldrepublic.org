"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSignMessage } from "wagmi";
import { useAccount, useChainId } from "wagmi";
import { SiweMessage } from "siwe";
import {
  getWalletSiweChallenge,
  verifyWalletSiwe,
} from "@/lib/actions/wallet-auth";
import {
  isAllowedWalletAuthChainId,
  type WalletAuthIntent,
} from "@/lib/wallet-auth";

type WalletAuthResult =
  | { success: true; walletAddress: string }
  | {
      success: false;
      error:
        | "wallet_not_connected"
        | "invalid_chain"
        | "challenge_failed"
        | "signature_rejected"
        | "invalid_signature"
        | "verification_failed"
        | "nonce_expired_or_used"
        | "wallet_already_linked"
        | "wallet_already_linked_on_this_account"
        | "unauthorized"
        | "invalid_payload";
    };

export function useWalletAuth() {
  const { openConnectModal } = useConnectModal();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();

  const authenticateWithWallet = async (
    intent: WalletAuthIntent,
  ): Promise<WalletAuthResult> => {
    if (!isConnected || !address) {
      openConnectModal?.();
      return { success: false, error: "wallet_not_connected" };
    }

    if (!isAllowedWalletAuthChainId(chainId)) {
      return { success: false, error: "invalid_chain" };
    }

    const challenge = await getWalletSiweChallenge(intent, chainId);
    if (!challenge.success) {
      return { success: false, error: "challenge_failed" };
    }

    const siweMessage = new SiweMessage({
      domain: challenge.domain,
      address,
      statement: challenge.statement,
      uri: challenge.uri,
      version: "1",
      chainId: challenge.chainId,
      nonce: challenge.nonce,
      issuedAt: challenge.issuedAt,
      expirationTime: challenge.expirationTime,
    });

    let signature: string;
    try {
      signature = await signMessageAsync({
        message: siweMessage.prepareMessage(),
      });
    } catch {
      return { success: false, error: "signature_rejected" };
    }

    const verifyResult = await verifyWalletSiwe({
      message: siweMessage.prepareMessage(),
      signature,
      intent,
    });

    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error };
    }

    return {
      success: true,
      walletAddress: verifyResult.walletAddress,
    };
  };

  return { authenticateWithWallet };
}
