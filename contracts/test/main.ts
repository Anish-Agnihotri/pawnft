import { expect } from "chai"; // Testing
import { BigNumber, Contract, Signer, Transaction } from "ethers"; // Ethers
import { SquigglesABI } from "./abi/squiggles"; // ABI
import { ethers, waffle, network } from "hardhat"; // Hardhat

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

// Potential revert error messages
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
  REPAY: {
    NO_BIDS: "Can't repay loan with 0 bids.",
    EXPIRED: "Can't repay expired loan.",
    ALREADY_REPAID: "Can't repay paid loan.",
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

// Setup global contracts
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
 * Deploys contracts via Lender one wallet funds and stores details globally
 */
async function deploy(): Promise<void> {
  // Impersonate Binance (Lender One)
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

/**
 * Collects Squiggles NFT contract connected to signer
 * @param {string} address of signer
 * @returns {Promise<Contract>} Squiggles NFT contract
 */
async function getSquigglesContract(address: string): Promise<Contract> {
  // Collect signer by address
  const signer = await impersonateSigner(address);
  // Return new contract w/ signer
  return new ethers.Contract(ADDRESSES.SQUIGGLE, SquigglesABI, signer);
}

/**
 * Scaffolds initial 1h loan
 */
async function scaffoldLoan(): Promise<void> {
  const { SnowfroBank } = await impersonateBanks();

  // Approve NFT for transfer
  const SquigglesContract = await getSquigglesContract(ADDRESSES.SNOWFRO);
  await SquigglesContract.approve(PawnBankContractAddress, SQUIGGLE_0);

  // Create loan w/ Chrome Squiggle #0
  await SnowfroBank.createLoan(
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

/**
 * Impersonates three actors and provides connected contracts
 * @returns {Promise<Record<string, Contract>>} actor: connected contract
 */
async function impersonateBanks(): Promise<Record<string, Contract>> {
  // Snowfro.eth
  const SnowfroSigner = await impersonateSigner(ADDRESSES.SNOWFRO);
  const SnowfroBank: Contract = PawnBankContract.connect(SnowfroSigner);

  // Lender One
  const LenderOneSigner = await impersonateSigner(ADDRESSES.LENDER_ONE);
  const LenderOneBank: Contract = PawnBankContract.connect(LenderOneSigner);

  // Lender Two
  const LenderTwoSigner = await impersonateSigner(ADDRESSES.LENDER_TWO);
  const LenderTwoBank: Contract = PawnBankContract.connect(LenderTwoSigner);

  // Return available connected contracts
  return { SnowfroBank, LenderOneBank, LenderTwoBank };
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
            jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
            blockNumber: 12864983,
          },
        },
      ],
    });

    // Deploy contract
    await deploy();

    // Scaffold initial loan
    await scaffoldLoan();
  });

  describe("Loan creation", () => {
    it("Should allow creating a loan", async () => {
      // Collect details
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      const SquiggleOGOwner: string = (await PawnBankContract.pawnLoans(0)).tokenOwner;

      // Verify that contract holds NFT
      expect(SquiggleOwner).to.equal(PawnBankContractAddress);
      // Verify that PawnLoan is created with correct owner
      expect(SquiggleOGOwner).to.equal(ADDRESSES.SNOWFRO);
    });

    it("Should prevent creating a loan in the past", async () => {
      const { SnowfroBank } = await impersonateBanks();

      // Force delete scaffold loan
      await SnowfroBank.cancelLoan(0);

      // Approve NFT for transfer
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      await SquigglesContract.approve(PawnBankContractAddress, SQUIGGLE_0);

      // Create loan w/ Chrome Squiggle #0 in past
      const tx: Transaction = SnowfroBank.createLoan(
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
      const { LenderOneBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Collect details
      const PawnBankBalance: BigNumber = await waffle.provider.getBalance(PawnBankContractAddress);
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
      const { LenderOneBank } = await impersonateBanks();

      // Back loan with 0 ETH
      const tx: Transaction = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("0.0"),
      });

      // Expect tx to fail
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.NO_0_UNDERWRITE);
    });

    it("Should prevent underwriting a repaid loan", async () => {
      const { SnowfroBank, LenderOneBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Draw and repay loan
      await SnowfroBank.drawLoan(0);
      const repaymentAmount: BigNumber = await SnowfroBank.calculateRequiredRepayment(0);
      await SnowfroBank.repayLoan(0, { value: repaymentAmount.mul(101).div(100) });

      // Attempt to re-underwrite loan
      const tx: Transaction = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.1"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.ALREADY_REPAID);
    });

    it("Should prevent underwriting an expired loan", async () => {
      const { LenderOneBank } = await impersonateBanks();

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Back loan with 1 ETH
      const tx: Transaction = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.EXPIRED);
    });

    it("Should prevent underwriting a loan under the current top bid", async () => {
      const { LenderOneBank, LenderTwoBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Back loan with <1 ETH
      const tx: Transaction = LenderTwoBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("0.5"),
      });

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.INSUFFICIENT_BID);
    });

    it("Should prevent underwriting a loan over the maxLoanAmount", async () => {
      const { LenderOneBank } = await impersonateBanks();

      // Back loan with 11 ETH
      const tx: Transaction = LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("11.0"),
      });

      // Expect tx to fail
      await expect(tx).revertedWith(ERROR_MESSAGES.UNDERWRITE.OVER_MAX_UNDERWRITE);
    });

    it("Should allow underwriting a loan with existing bid", async () => {
      const { LenderOneBank, LenderTwoBank } = await impersonateBanks();

      // First lender balance
      const previousBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.LENDER_ONE);

      // Back loan with 5 ETH
      const tx = await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Back loan with 6 ETH
      const totalInterest: BigNumber = await LenderTwoBank.calculateTotalInterest(0);
      const totalBuffer: BigNumber = totalInterest.mul(2);
      const higherLoan: BigNumber = ethers.utils.parseEther("6.0").add(totalBuffer);
      await LenderTwoBank.underwriteLoan(0, { value: higherLoan });

      // Collect details
      const NewTopLender: string = (await LenderTwoBank.pawnLoans(0)).lender;
      const expectedLenderOneBalance: BigNumber = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(totalBuffer);
      const acutalLenderOneBalance: BigNumber = await waffle.provider.getBalance(
        ADDRESSES.LENDER_ONE
      );

      // Verify first lender received principle + interest
      expect(acutalLenderOneBalance).to.be.gte(expectedLenderOneBalance);
      // Verify second lender is now top bidder
      expect(NewTopLender).to.equal(ADDRESSES.LENDER_TWO);
    });
  });

  describe("Loan drawing", () => {
    it("Should allow drawing from a loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Collect previous Snowfro balance
      const previousBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);

      // Draw 5ETH
      const tx = await SnowfroBank.drawLoan(0);
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Collect after Snowfro balance
      const afterBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance: BigNumber = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(ethers.utils.parseEther("5.0"));

      expect(afterBalance).to.equal(expectedAfterBalance);
    });

    it("Should allow drawing additional capital from a new bid", async () => {
      const { LenderOneBank, LenderTwoBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Collect previous Snowfro balance
      const previousBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);

      // Draw 5ETH
      const tx = await SnowfroBank.drawLoan(0);
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Check for Snowfro balance increment
      const afterBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance: BigNumber = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(ethers.utils.parseEther("5.0"));
      expect(afterBalance).to.equal(expectedAfterBalance);

      // Back loan with 6 ETH
      const totalInterest: BigNumber = await LenderTwoBank.calculateTotalInterest(0);
      const totalBuffer: BigNumber = totalInterest.mul(2);
      const higherLoan: BigNumber = ethers.utils.parseEther("6.0").add(totalBuffer);
      await LenderTwoBank.underwriteLoan(0, { value: higherLoan });

      // Draw 6ETH
      const tx2 = await SnowfroBank.drawLoan(0);
      const receipt2 = await waffle.provider.getTransactionReceipt(tx2.hash);

      // Check for Snowfro balance increment
      const afterBalance2: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance2: BigNumber = afterBalance
        .sub(tx2.gasPrice.mul(receipt2.cumulativeGasUsed))
        .add(ethers.utils.parseEther("1.0"));

      expect(afterBalance2).to.equal(expectedAfterBalance2);
    });

    it("Should prevent drawing from a loan with no bids", async () => {
      const { SnowfroBank } = await impersonateBanks();

      // Attempt to draw ETH
      const tx: Transaction = SnowfroBank.drawLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.NO_CAPACITY);
    });

    it("Should prevent non-owners from drawing from loan", async () => {
      const { LenderOneBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Attempt to collect loan as Lender
      const tx: Transaction = LenderOneBank.drawLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.NOT_OWNER);
    });

    it("Should prevent consecutive draws from a loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Draw 5ETH
      await SnowfroBank.drawLoan(0);
      // Attempt to redraw
      const tx: Transaction = SnowfroBank.drawLoan(0);

      await expect(tx).revertedWith(ERROR_MESSAGES.DRAW.MAX_CAPACITY);
    });

    it("Should allow drawing loan after NFT seizure", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

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
      const previousBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);

      // Draw 5ETH
      const tx = await SnowfroBank.drawLoan(0);
      const receipt = await waffle.provider.getTransactionReceipt(tx.hash);

      // Collect after Snowfro balance
      const afterBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.SNOWFRO);
      const expectedAfterBalance: BigNumber = previousBalance
        .sub(tx.gasPrice.mul(receipt.cumulativeGasUsed))
        .add(ethers.utils.parseEther("5.0"));

      // Expect increase in balance
      expect(afterBalance).to.equal(expectedAfterBalance);
    });
  });

  describe("Loan repayment", () => {
    it("Should allow repaying loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Record Lender balance
      const previousLenderBalance: BigNumber = await waffle.provider.getBalance(
        ADDRESSES.LENDER_ONE
      );

      // Fast forward <1h
      await network.provider.send("evm_increaseTime", [3500]);
      await network.provider.send("evm_mine");

      // Calculate repayment amount
      const repaymentAmount: BigNumber = await SnowfroBank.calculateRequiredRepayment(0);
      const repaymentBuffer: BigNumber = repaymentAmount.mul(101).div(100);

      // Repay loan
      await SnowfroBank.repayLoan(0, { value: repaymentBuffer });

      // Expect loan to be closed
      const NewLoanOwner: string = (await SnowfroBank.pawnLoans(0)).tokenOwner;
      expect(NewLoanOwner).to.equal(ADDRESSES.ZERO);

      // Expect NFT to be owned by original owner
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      expect(SquiggleOwner).to.equal(ADDRESSES.SNOWFRO);

      // Expect increase in Lender One balance by ~.243 ETH
      const afterLenderBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.LENDER_ONE);
      expect(afterLenderBalance).to.be.gte(previousLenderBalance.add(repaymentAmount));
    });

    it("Should allow repaying someone elses loan", async () => {
      const { LenderOneBank, LenderTwoBank } = await impersonateBanks();

      // Back loan with 5 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("5.0"),
      });

      // Record Lender balance
      const previousLenderBalance: BigNumber = await waffle.provider.getBalance(
        ADDRESSES.LENDER_ONE
      );

      // Fast forward <1h
      await network.provider.send("evm_increaseTime", [3500]);
      await network.provider.send("evm_mine");

      // Calculate repayment amount
      const repaymentAmount: BigNumber = await LenderTwoBank.calculateRequiredRepayment(0);
      const repaymentBuffer: BigNumber = repaymentAmount.mul(101).div(100);

      // Repay loan
      await LenderTwoBank.repayLoan(0, { value: repaymentBuffer });

      // Expect loan to be closed
      const NewLoanOwner: string = (await LenderTwoBank.pawnLoans(0)).tokenOwner;
      expect(NewLoanOwner).to.equal(ADDRESSES.ZERO);

      // Expect NFT to be owned by original owner
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      expect(SquiggleOwner).to.equal(ADDRESSES.SNOWFRO);

      // Expect increase in Lender One balance by ~.243 ETH
      const afterLenderBalance: BigNumber = await waffle.provider.getBalance(ADDRESSES.LENDER_ONE);
      expect(afterLenderBalance).to.be.gte(previousLenderBalance.add(repaymentAmount));
    });

    it("Should prevent repaying loan w/ 0 bids", async () => {
      const { SnowfroBank } = await impersonateBanks();

      // Attempt to repay loan
      const tx: Transaction = SnowfroBank.repayLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.REPAY.NO_BIDS);
    });

    it("Should prevent repaying expired loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Attempt to repay loan
      const tx: Transaction = SnowfroBank.repayLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.REPAY.EXPIRED);
    });

    it("Should prevent repaying paid loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Fast forward <1h
      await network.provider.send("evm_increaseTime", [3500]);
      await network.provider.send("evm_mine");

      // Calculate repayment amount
      const repaymentAmount: BigNumber = await SnowfroBank.calculateRequiredRepayment(0);
      const repaymentBuffer: BigNumber = repaymentAmount.mul(101).div(100);

      // Repay loan
      await SnowfroBank.repayLoan(0, { value: repaymentBuffer });

      // Attempt to re-repay loan
      const tx: Transaction = SnowfroBank.repayLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.REPAY.ALREADY_REPAID);
    });
  });

  describe("Loan cancellation", () => {
    it("Should allow cancelling loan with 0 bids", async () => {
      const { SnowfroBank } = await impersonateBanks();

      // Cancel loan
      await SnowfroBank.cancelLoan(0);

      // Collect details
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);
      const NewLoanOwner: string = (await SnowfroBank.pawnLoans(0)).tokenOwner;

      // Verify that Snowfro holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.SNOWFRO);
      // Verify that PawnLoan is nullifed w/ 0 address
      expect(NewLoanOwner).to.equal(ADDRESSES.ZERO);
    });

    it("Should prevent cancelling loan with >0 bids", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Attempt to cancel loan with 1.0 bid existing
      const tx: Transaction = SnowfroBank.cancelLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.CANCEL.NON_ZERO_BIDS);
    });

    it("Should prevent cancelling loan if not owner", async () => {
      const { LenderOneBank } = await impersonateBanks();

      // Attempt to cancel loan as Lender One
      const tx: Transaction = LenderOneBank.cancelLoan(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.CANCEL.NOT_OWNER);
    });
  });

  describe("Loan seizing", () => {
    it("Should allow lender to seize NFT", async () => {
      const { LenderOneBank } = await impersonateBanks();

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
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);

      // Verify that Lender One holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.LENDER_ONE);
    });

    it("Should allow anyone to seize NFT on behalf of lender", async () => {
      const { LenderOneBank, LenderTwoBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Fast forward >1h
      await network.provider.send("evm_increaseTime", [3601]);
      await network.provider.send("evm_mine");

      // Seize NFT
      await LenderTwoBank.seizeNFT(0);

      // Collect details
      const SquigglesContract: Contract = await getSquigglesContract(ADDRESSES.SNOWFRO);
      const SquiggleOwner: string = await SquigglesContract.ownerOf(SQUIGGLE_0);

      // Verify that Lender One holds NFT
      expect(SquiggleOwner).to.equal(ADDRESSES.LENDER_ONE);
    });

    it("Should prevent seizing NFT before loan expiration", async () => {
      const { LenderOneBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Seize NFT
      const tx: Transaction = LenderOneBank.seizeNFT(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.SEIZE.NOT_EXPIRED);
    });

    it("Should prevent seizing repaid loan", async () => {
      const { LenderOneBank, SnowfroBank } = await impersonateBanks();

      // Back loan with 1 ETH
      await LenderOneBank.underwriteLoan(0, {
        value: ethers.utils.parseEther("1.0"),
      });

      // Draw and repay loan
      await SnowfroBank.drawLoan(0);
      const repaymentAmount: BigNumber = await SnowfroBank.calculateRequiredRepayment(0);
      await SnowfroBank.repayLoan(0, { value: repaymentAmount.mul(101).div(100) });

      // Seize NFT
      const tx: Transaction = LenderOneBank.seizeNFT(0);

      // Expect revert
      await expect(tx).revertedWith(ERROR_MESSAGES.SEIZE.ALREADY_REPAID);
    });
  });
});
