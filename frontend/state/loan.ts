import { ethers } from "ethers"; // Ethers
import { eth } from "@state/eth"; // ETH state
import { ERC721ABI } from "@utils/abi/erc721"; // ABI: ERC721
import { createContainer } from "unstated-next"; // State
import { PawnBankABI } from "@utils/abi/PawnBank"; // ABI: PawnBank

// Constant: Pawn Bank deployed address
const PAWN_BANK_ADDRESS: string =
  process.env.PAWN_BANK_ADDRESS ?? "0x4D5c6F5383235D43B86EAa9b4482B0FD7EFd09BD";

/**
 * Provides utility functions for use with loan management
 */
function useLoan() {
  // Collect provider from eth state
  const { provider } = eth.useContainer();

  /**
   * Generates new ERC721 contract from ERC721 token address
   * @param {string} address of ERC721 contract
   * @returns {ethers.Contract} connected to provider
   */
  async function collectERC721Contract(
    address: string
  ): Promise<ethers.Contract | undefined> {
    if (provider) {
      return new ethers.Contract(
        address,
        ERC721ABI,
        await provider.getSigner()
      );
    }
  }

  /**
   * Generates PawnBank contract
   * @returns {ethers.Contract} connected to provider
   */
  async function collectPawnBankContract(): Promise<
    ethers.Contract | undefined
  > {
    if (provider) {
      return new ethers.Contract(
        PAWN_BANK_ADDRESS,
        PawnBankABI,
        await provider.getSigner()
      );
    }
  }

  /**
   * Create PawnBank loan
   * @param {string} contract address for NFT
   * @param {string} id NFT id
   * @param {number} rate interest rate
   * @param {number} amount bid ceiling
   * @param {number} completion timestamp of completion
   * @returns {Promise<number | undefined>} loan id
   */
  async function createLoan(
    contract: string,
    id: string,
    rate: number,
    amount: number,
    completion: number
  ): Promise<number | undefined> {
    const nft = await collectERC721Contract(contract);
    const PawnBank = await collectPawnBankContract();

    // Ensure !undefined
    if (nft && PawnBank) {
      const tx = await nft.approve(PAWN_BANK_ADDRESS, id, { gasLimit: 50000 });
      await tx.wait(1);

      const pawn = await PawnBank.createLoan(
        contract,
        id,
        rate,
        amount,
        Math.round(completion / 1000),
        { gasLimit: 350000 }
      );
      // Collect Loan Creation event
      const confirmed_tx = await pawn.wait(1);
      const creation_event = confirmed_tx.events.filter(
        (event) => event && "event" in event && event.event === "LoanCreated"
      )[0];
      // Return loan id
      return creation_event.args[0].toString();
    }
  }

  return {
    createLoan,
  };
}

// Create unstated-next container
export const loan = createContainer(useLoan);
