import { ethers } from "ethers";
import Onboard from "bnc-onboard";
import { useEffect, useState } from "react";
import { createContainer } from "unstated-next";

// Onboarding wallet providers
const wallets = [
  { walletName: "metamask" },
  {
    walletName: "walletConnect",
    infuraKey: process.env.NEXT_PUBLIC_INFURA_RPC,
  },
];

function useEth() {
  const [address, setAddress] = useState(null); // User address
  const [onboard, setOnboard] = useState(null); // Onboard provider
  const [provider, setProvider] = useState(null); // Ethers provider
  const [rawAddress, setRawAddress] = useState(null); // Non-ENS address

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
            const address = await signer.getAddress();

            // Collect ENS name
            const ensName = await provider.lookupAddress(address);

            // Update provider, address, and raw address
            setProvider(provider);
            setRawAddress(address);
            setAddress(ensName ? ensName : address);
          } else {
            // Nullify data
            setProvider(null);
            setRawAddress(null);
            setAddress(null);
          }
        },
      },
      // Force connect on walletCheck for WalletConnect
      walletCheck: [{ checkName: "connect" }],
    });

    // Update onboard
    setOnboard(onboard);
  }, []);

  return { address, rawAddress, provider, unlock };
}

// Create unstated-next container
export const eth = createContainer(useEth);
