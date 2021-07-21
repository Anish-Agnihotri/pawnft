import { expect } from "chai";
import { Contract, Signer } from "ethers";
import { ethers, waffle, network } from "hardhat";
import { SquigglesABI } from "./abi/squiggles";

// Setup test Chromie Squiggle NFT
const SQUIGGLE_0: number = 0;

// Setup addresses
const ADDRESSES: Record<string, string> = {
  // Snowfro w/ Chromie Squiggle #0
  SNOWFRO: "0xf3860788D1597cecF938424bAABe976FaC87dC26",
  // Chromie Squiggles
  SQUIGGLE: "0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a",
  // Binance
  LENDER_ONE: "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8",
  // Kraken
  LENDER_TWO: "0x53d284357ec70cE289D6D64134DfAc8E511c8a3D",
  // Zero address
  ZERO: "0x0000000000000000000000000000000000000000",
};

const ERROR_MESSAGES: Record<string, Record<string, string>> = {
  CREATE: {
    NO_EXPIRED_LOAN: "Can't create loan in past",
  },
  UNDERWRITE: {
    NO_0_UNDERWRITE: "Can't underwrite with 0 Ether.",
    OVER_MAX_UNDERWRITE: "Can't underwrite > max loan.",
    INSUFFICIENT_BID: "Can't underwrite < top lender.",
    ALREADY_REPAID: "Can't underwrite a repaid loan.",
    EXPIRED: "Can't underwrite expired loan.",
  },
  DRAW: {
    NO_CAPACITY: "No capacity to draw loan.",
    MAX_CAPACITY: "Max draw capacity reached.",
    NOT_OWNER: "Must be NFT owner to draw.",
  },
  CANCEL: {
    NON_ZERO_BIDS: "Can't cancel loan with >0 bids.",
    NOT_OWNER: "Must be NFT owner to cancel.",
  },
  SEIZE: {
    NOT_EXPIRED: "Can't seize before expiry.",
    ALREADY_REPAID: "Can't seize from repaid loan.",
  },
};

// Setup contract
let PawnBankContract: Contract;
let PawnBankContractAddress: string;

/**
 * Returns impersonated signer
 * @param {string} account to impersonate
 * @returns {Signer} authenticated as account
 */
async function impersonateSigner(account: string): Promise<Signer> {
  // Impersonate account
  await network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });

  // Return ethers signer
  return await ethers.provider.getSigner(account);
}

/**
 * Deploys contracts via Binance wallet funds and stores details globally
 */
async function deploy(): Promise<void> {
  // Impersonate Binance
  const binanceSigner: Signer = await impersonateSigner(ADDRESSES.LENDER_ONE);

  // Deploy PawnBank contracts
  const PawnBank = await ethers.getContractFactory("PawnBank");
  const contractWithSigner = PawnBank.connect(binanceSigner);
  const contract = await contractWithSigner.deploy();
  await contract.deployed();

  // Store contract details to global variables
  PawnBankContract = contract;
  PawnBankContractAddress = contract.address.toString();
}

async function getSquigglesContract(address: string) {
  const signer = await impersonateSigner(address);
  return new ethers.Contract(ADDRESSES.SQUIGGLE, SquigglesABI, signer);
}

async function scaffoldLoan(): Promise<void> {
  // Impersonate Snowfro.eth
  const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
  const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

  // Approve NFT for transfer
  const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
  await SquigglesContract.approve(PawnBankContractAddress, SQUIGGLE_0);

  // Create loan w/ Chrome Squiggle #0
  await SnowfroPawnBank.createLoan(
    // Token address
    ADDRESSES.SQUIGGLE,
    // Token ID
    SQUIGGLE_0,
    // Interest rate
    5,
    // Max loan amount
    ethers.utils.parseEther("10"),
    // Loan completion time (in 1 hour from forking block)
    1626808526
  );
}

describe("PawnBank", () => {
  // Pre-setup
  beforeEach(async () => {
    // Reset hardhat forknet
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: process.env.RPC_NODE_URL,
            blockNumber: 12864983,
          },
        },
      ],
    });

    // Deploy contract
    await deploy();
  });

  describe("Loan creation", () => {
    it("Should allow creating a loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Collect details
      const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      const SquiggleOGOwner: string = (await PawnBankContract.pawnLoans(0)).tokenOwner;

      // Verify that contract holds NFT
      expect(SquiggleOwner).to.equal(PawnBankContractAddress);
      // Verify that PawnLoan is created with correct owner
      expect(SquiggleOGOwner).to.equal(ADDRESSES.SNOWFRO);
    });

    it("Should prevent creating a loan in the past", async () => {
      // Impersonate Snowfro.eth
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Approve NFT for transfer
      const SquigglesContract: Contract = new ethers.Contract(
        ADDRESSES.SQUIGGLE,
        SquigglesABI,
        SnowfroSigner
      );
      await SquigglesContract.approve(PawnBankContractAddress, SQUIGGLE_0);

      // Create loan w/ Chrome Squiggle #0 in past
      const tx = SnowfroPawnBank.createLoan(
        // Token address
        ADDRESSES.SQUIGGLE,
        // Token ID
        SQUIGGLE_0,
        // Interest rate
        5,
        // Max loan amount
        ethers.utils.parseEther("10"),
        // Loan completion time (5 years ago)
        Math.floor(Date.now() / 1000) - 157680000
      );

      // Expect tx to revert because loan completion time < current time
      await expect(tx).revertedWith(ERROR_MESSAGES.CREATE.NO_EXPIRED_LOAN);
    });
  });

  describe("Loan underwriting", () => {
    it("Should allow underwriting a new loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Collect details
      const PawnBankBalance = await waffle.provider.getBalance(PawnBankContractAddress);
      const PawnLoanDetails = await LenderOneBank.pawnLoans(0);

      // Verify contract balance is increased
      expect(PawnBankBalance.toString()).to.equal("1000000000000000000");
      // Verify loan has 1 ether available to draw
      expect(PawnLoanDetails.loanAmount.toString()).to.equal("1000000000000000000");
      // Verify loan has 0 capital drawn
      expect(PawnLoanDetails.loanAmountDrawn.toString()).to.equal("0");
      // Verify new lender is Lender One
      expect(PawnLoanDetails.lender).to.equal(ADDRESSES.LENDER_ONE);
    });

    it("Should prevent underwriting a new loan with 0 Ether", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 0 ETH
      const tx = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("0.0"),
      });

      // Expect tx to fail
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.NO_0_UNDERWRITE);
    });

    it("Should prevent underwriting a repaid loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Impersonate Snowfro.eth
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Draw and repay loan
      await SnowfroPawnBank.drawLoan(0);
      await SnowfroPawnBank.repayLoan(0, { value: ethers.utils.parseEther("1") });

      // Attempt to re-underwrite loan
      const tx = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.1"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.ALREADY_REPAID);
    });

    it("Should prevent underwriting an expired loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      const tx = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.EXPIRED);
    });

    it("Should prevent underwriting a loan under the current top bid", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Impersonate Lender Two
      const LenderTwoSigner = await impersonateSigner(ADDRESSES.LENDER_TWO);
      const LenderTwoBank = PawnBankContract.connect(LenderTwoSigner);

      // Back loan with <1 ETH
      const tx = LenderTwoBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("0.5"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.INSUFFICIENT_BID);
    });

    it("Should prevent underwriting a loan over the maxLoanAmount", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 11 ETH
      const tx = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("11.0"),
      });

      // Expect tx to fail
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.OVER_MAX_UNDERWRITE);
    });

    it("Should allow underwriting a loan with existing bid", async () => {
      expect(false).to.equal(true);
    });
  });

  // it("Should allow underwriting a loan with existing bids", async () => {});

  describe("Loan drawing", () => {
    it("Should allow drawing from a loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Collect previous Snowfro balance
      const previousBalance = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Draw 5ETH
      const tx = await SnowfroPawnBank.drawLoan(0);
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Collect after Snowfro balance
      const afterBalance = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(ethers.utils.parseEther("5.0"));

      expect(afterBalance.toString()).to.equal(expectedAfterBalance.toString());
    });

    it("Should allow drawing additional capital from a new bid", async () => {
      expect(false).to.equal(true);
    });

    it("Should prevent drawing from a loan with no bids", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Attempt to draw ETH
      const tx = SnowfroPawnBank.drawLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.NO_CAPACITY);
    });

    it("Should prevent non-owners from drawing from loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Attempt to collect loan as Lender
      const tx = LenderOneBank.drawLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.NOT_OWNER);
    });

    it("Should prevent consecutive draws from a loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Draw 5ETH
      await SnowfroPawnBank.drawLoan(0);
      // Attempt to redraw
      const tx = SnowfroPawnBank.drawLoan(0);

      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.MAX_CAPACITY);
    });

    it("Should allow drawing loan after NFT seizure", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Seize NFT
      await LenderOneBank.seizeNFT(0);

      // Collect previous Snowfro balance
      const previousBalance = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Draw 5ETH
      const tx = await SnowfroPawnBank.drawLoan(0);
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Collect after Snowfro balance
      const afterBalance = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(ethers.utils.parseEther("5.0"));

      // Expect increase in balance
      expect(afterBalance.toString()).to.equal(expectedAfterBalance.toString());
    });
  });

  describe("Loan repayment", () => {
    it("Should allow repaying loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Record Lender balance
      const previousLenderBalance = await waffle.provider.getBalance(ADDRESSES.LENDER_ONE);

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Fast forward <1h
      await network.provider.send("evm_increaseTime", [3500]);
      await network.provider.send("evm_mine");

      // Calculate repayment amount
      const repaymentAmount = await SnowfroPawnBank.calculateRequiredRepayment(0);
      console.log("Calculated repayment amount: ", repaymentAmount.toString());

      // Repay loan
      await SnowfroPawnBank.repayLoan(0, { value: repaymentAmount });

      // Expect loan to be closed
      const NewLoanOwner: string = (await SnowfroPawnBank.pawnLoans(0)).tokenOwner;
      expect(NewLoanOwner).to.equal(ADDRESSES.ZERO);

      // Expect NFT to be owned by original owner
      const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      expect(SquiggleOwner).to.equal(ADDRESSES.SNOWFRO);

      // Expect increase in Lender One balance by .25 ETH
      const afterLenderBalance = await waffle.provider.getBalance(ADDRESSES.LENDER_ONE);
      expect(previousLenderBalance.add(repaymentAmount)).to.equal(afterLenderBalance);
    });

    it("Should allow repaying loan w/ partial deposit", async () => {
      expect(false).to.equal(true);
    });

    it("Should allow repaying someone elses loan", async () => {
      expect(false).to.equal(true);
    });

    it("Should allow repaying after 1+ bid via historicInterest", async () => {
      expect(false).to.equal(true);
    });

    it("Should prevent repaying loan w/ 0 bids", async () => {
      expect(false).to.equal(true);
    });

    it("Should prevent repaying expired loan", async () => {
      expect(false).to.equal(true);
    });

    it("Should prevent repaying paid loan", async () => {
      expect(false).to.equal(true);
    });
  });

  describe("Loan cancellation", () => {
    it("Should allow cancelling loan with 0 bids", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Cancel loan
      await SnowfroPawnBank.cancelLoan(0);

      // Collect details
      const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      const NewLoanOwner: string = (await SnowfroPawnBank.pawnLoans(0)).tokenOwner;

      // Verify that Snowfro holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.SNOWFRO);
      // Verify that PawnLoan is nullifed w/ 0 address
      expect(NewLoanOwner).to.equal(ADDRESSES.ZERO);
    });

    it("Should prevent cancelling loan with >0 bids", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Impersonate Snowfro
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Attempt to cancel loan with 1.0 bid existing
      const tx = SnowfroPawnBank.cancelLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.CANCEL.NON_ZERO_BIDS);
    });

    it("Should prevent cancelling loan if not owner", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Attempt to cancel loan as Lender One
      const tx = LenderOneBank.cancelLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.CANCEL.NOT_OWNER);
    });
  });

  describe("Loan seizing", () => {
    it("Should allow lender to seize NFT", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Seize NFT
      await LenderOneBank.seizeNFT(0);

      // Collect details
      const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);

      // Verify that Lender One holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.LENDER_ONE);
    });

    it("Should allow anyone to seize NFT on behalf of lender", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Impersonate Lender Two and Seize NFT
      const LenderTwoSigner = await impersonateSigner(ADDRESSES.LENDER_TWO);
      const LenderTwoBank = PawnBankContract.connect(LenderTwoSigner);
      await LenderTwoBank.seizeNFT(0);

      // Collect details
      const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);

      // Verify that Lender One holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.LENDER_ONE);
    });

    it("Should prevent seizing NFT before loan expiration", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Seize NFT
      const tx = LenderOneBank.seizeNFT(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.SEIZE.NOT_EXPIRED);
    });

    it("Should prevent seizing repaid loan", async () => {
      // Create loan
      await scaffoldLoan();

      // Impersonate Lender One
      const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
      const LenderOneBank = PawnBankContract.connect(LenderOneSigner);

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Impersonate Snowfro.eth
      const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
      const SnowfroPawnBank = PawnBankContract.connect(SnowfroSigner);

      // Draw and repay loan
      await SnowfroPawnBank.drawLoan(0);
      await SnowfroPawnBank.repayLoan(0, { value: ethers.utils.parseEther("1") });

      // Seize NFT
      const tx = LenderOneBank.seizeNFT(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.SEIZE.ALREADY_REPAID);
    });
  });
});
