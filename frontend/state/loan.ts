import axios from "axios"; // Axios
import { eth } from "@state/eth"; // ETH state
import { toast } from "react-toastify"; // Toast notifications
import { BigNumber, ethers } from "ethers"; // Ethers
import { ERC721ABI } from "@utils/abi/erc721"; // ABI: ERC721
import { createContainer } from "unstated-next"; // State
import { PawnBankABI } from "@utils/abi/PawnBank"; // ABI: PawnBank
import { PAWN_BANK_ADDRESS } from "@utils/ethers"; // Utils

/*
  TODO: better types for loan returns
  TODO: refactor various similar functions into one class
  TODO: fix arbitrary gas limits
*/

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
   * Allows underwriting an active loan
   * @param {number} loanId to underwrite
   * @param {number} value to underwrite with
   */
  async function underwriteLoan(loanId: number, value: number): Promise<void> {
    // Collect contract
    const PawnBank = await collectPawnBankContract();

    // Force contract != undefined
    if (PawnBank) {
      // Collect loan
      const loan: any = await PawnBank.pawnLoans(loanId);

      let underWriteAmount: BigNumber;
      // If this is the first bid
      if (loan.firstBidTime == 0) {
        // Run simple calculation
        underWriteAmount = ethers.utils.parseEther(value.toString());
      } else {
        // Required repayment
        const interest = await PawnBank.calculateTotalInterest(loanId, 120);
        // Else add new value
        underWriteAmount = ethers.utils
          .parseEther(value.toString())
          // To a 2m buffer
          .add(interest);
      }

      try {
        // Send transaction and wait
        const tx = await PawnBank.underwriteLoan(loanId, {
          value: underWriteAmount,
          gasLimit: 150000,
        });
        await tx.wait(1);
        toast.success("Successfully underwrote NFT.");
      } catch (e) {
        // If error, alert
        console.error(e);
        toast.error(`Error when attempting to underwrite NFT.`);
      }
    }
  }

  /**
   * Allows repaying a loan
   * @param {number} loanId to repay
   */
  async function repayLoan(loanId: number): Promise<void> {
    // Collect contract
    const PawnBank = await collectPawnBankContract();

    // Force contract != undefined
    if (PawnBank) {
      // Calculate required payment (2m in future to account for inclusion time)
      const contractRequired = await PawnBank.calculateRequiredRepayment(
        loanId,
        120
      );

      try {
        // Send transaction and alert success
        const tx = await PawnBank.repayLoan(loanId, {
          value: contractRequired,
          gasLimit: 300000,
        });
        await tx.wait(1);
        toast.success("Successfully repaid loan.");
      } catch (e) {
        // If error, alert
        console.error(e);
        toast.error(`Error when attempting to repay loan ${loanId}.`);
      }
    }
  }

  /**
   * Allows seizing NFT collateral from an expired loan
   * @param {number} loanId to seize
   */
  async function seizeLoan(loanId: number): Promise<void> {
    // Collect contract
    const PawnBank = await collectPawnBankContract();

    // Enforce contract != undefined
    if (PawnBank) {
      try {
        // Send seize transaction and wait for success
        const tx = await PawnBank.seizeNFT(loanId, { gasLimit: 120000 });
        await tx.wait(1);
        toast.success("Successfully seized NFT from loan.");
      } catch (e) {
        // If erorr, alert failure
        console.error(e);
        toast.error(`Error when attempting to seize NFT from loan ${loanId}.`);
      }
    }
  }

  /**
   * Draw loan (as owner)
   * @param {number} loanId to draw from
   */
  async function drawLoan(loanId: number): Promise<void> {
    // Collect contract
    const PawnBank = await collectPawnBankContract();

    // Enforce contract != undefined
    if (PawnBank) {
      try {
        // Send transaction and await success
        const tx = await PawnBank.drawLoan(loanId, { gasLimit: 75000 });
        await tx.wait(1);
        toast.success("Successfully drew from loan.");
      } catch (e) {
        // If error, alert
        console.error(e);
        toast.error(`Error when attempting to draw from loan ${loanId}.`);
      }
    }
  }

  /**
   * Allows owner to cancel loan
   * @param {number} loanId to cancel
   */
  async function cancelLoan(loanId: number): Promise<void> {
    // Collect contract
    const PawnBank = await collectPawnBankContract();

    // Enforce contract != undefined
    if (PawnBank) {
      try {
        // Send tranaction and await success
        const tx = await PawnBank.cancelLoan(loanId, { gasLimit: 75000 });
        await tx.wait(1);
        toast.success("Successfully cancelled loan.");
      } catch (e) {
        // If error, alert
        console.error(e);
        toast.error(`Error when attempting to cancel loan ${loanId}.`);
      }
    }
  }

  /**
   * Create PawnBank loan
   * @param {string} contract address for NFT
   * @param {string} id NFT id
   * @param {number} rate interest rate
   * @param {number} amount bid ceiling
   * @param {number} completion timestamp of completion
   * @param {Record<string, string>} metadata temporary redis bypass for OpenSea
   * @returns {Promise<number | undefined>} loan id
   */
  async function createLoan(
    contract: string,
    id: string,
    rate: number,
    amount: number,
    completion: number,
    metadata: Record<string, string>
  ): Promise<number | undefined> {
    const nft = await collectERC721Contract(contract);
    const PawnBank = await collectPawnBankContract();

    // Ensure !undefined
    if (nft && PawnBank) {
      // FIXME: Temporary opensea bypass, post metadata to Redis
      await axios.post("/api/metadata", {
        tokenAddress: contract,
        tokenId: id,
        ...metadata,
      });

      // Force approve NFT
      const tx = await nft.approve(PAWN_BANK_ADDRESS, id, { gasLimit: 50000 });
      await tx.wait(1);

      // Create loan
      const pawn = await PawnBank.createLoan(
        contract,
        id,
        rate,
        ethers.utils.parseEther(amount.toString()),
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
    drawLoan,
    seizeLoan,
    cancelLoan,
    underwriteLoan,
    repayLoan,
  };
}

// Create unstated-next container
export const loan = createContainer(useLoan);
