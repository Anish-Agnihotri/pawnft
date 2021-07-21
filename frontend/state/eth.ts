import { ethers } from "ethers"; // Ethers
import Onboard from "bnc-onboard"; // Onboard.js
import { useEffect, useState } from "react"; // React
import { createContainer } from "unstated-next"; // State management

// Types
import type {
  API,
  WalletInitOptions,
  WalletModule,
} from "bnc-onboard/dist/src/interfaces";
import type { Web3Provider } from "@ethersproject/providers";

// Onboard.js wallet providers
const wallets: (WalletModule | WalletInitOptions)[] = [
  { walletName: "metamask" },
  {
    walletName: "walletConnect",
    infuraKey: process.env.NEXT_PUBLIC_INFURA_RPC ?? "",
  },
];

/**
 * Provides functionality for Eth account/state management
 */
function useEth() {
  const [address, setAddress] = useState<string | null>(null); // User address
  const [onboard, setOnboard] = useState<API | null>(null); // Onboard provider
  const [provider, setProvider] = useState<Web3Provider | null>(null); // Ethers provider

  /**
   * Unlock wallet, store ethers provider and address
   */
  const unlock = async () => {
    // Enables wallet selection via BNC onboard
    await onboard.walletSelect();
    await onboard.walletCheck();
  };

  // --> Lifecycle: on mount
  useEffect(() => {
    // Onboard provider
    const onboard = Onboard({
      // Rinkeby testnet
      networkId: 4,
      // Hide Blocknative branding
      hideBranding: true,
      // Setup custom wallets for selection
      walletSelect: {
        heading: "Connect to PawnLoan",
        description: "Please select a wallet to authenticate with PawnLoan.",
        wallets: wallets,
      },
      // Track subscriptions
      subscriptions: {
        // On wallet update
        wallet: async (wallet) => {
          // If wallet provider exists
          if (wallet.provider) {
            // Collect ethers provider
            const provider = new ethers.providers.Web3Provider(wallet.provider);

            // Collect address
            const signer = await provider.getSigner();
            const address: string = await signer.getAddress();

            // Update provider, address, and raw address
            setProvider(provider);
            setAddress(address);
          } else {
            // Nullify data
            setProvider(null);
            setAddress(null);
          }
        },
      },
      // Force connect on walletCheck for WalletConnect
      walletCheck: [{ checkName: "network" }, { checkName: "connect" }],
    });

    // Update onboard
    setOnboard(onboard);
  }, []);

  return { address, provider, unlock };
}

// Create unstated-next container
export const eth = createContainer(useEth);
