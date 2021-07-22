import Redis from "ioredis"; // Redis
import { parseEther, PawnBankRPC } from "@utils/ethers"; // RPC

// Types
import type { BigNumber } from "ethers";
import type { LoanWithMetadata } from "@utils/types";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Collects data about all loans
 * @returns {Promise<LoanWithMetadata[]>}
 */
async function collectAllLoans(): Promise<LoanWithMetadata[]> {
  // FIXME: hack to bypass OpenSea depencency
  // Retrieve metadata for all NFTs
  const client = new Redis(process.env.REDIS_URL);
  let request = await client.get("metadata");
  let metadata: Record<string, Record<string, string>> = {};
  if (request) {
    metadata = JSON.parse(request);
  }

  // Collect number of created loans
  const numLoans: BigNumber = await PawnBankRPC.numLoans();
  const numLoansInt: number = numLoans.toNumber();

  // Temporary array to store loan data
  let loans: LoanWithMetadata[] = [];

  // For each loan
  for (let i = 0; i < numLoansInt; i++) {
    // Collect loan information from contract
    const loan: any[] = await PawnBankRPC.pawnLoans(i);
    // Collect loan metadata from temporary Redis store
    const { name, description, imageURL } =
      metadata[`${loan[0].toLowerCase()}-${loan[3].toString()}`];

    // Push loan data
    loans.push({
      loanId: i,
      name,
      description,
      imageURL,
      tokenAddress: loan[0],
      tokenOwner: loan[1],
      lender: loan[2],
      tokenId: loan[3].toNumber(),
      interestRate: loan[4].toNumber(),
      loanAmount: parseEther(loan[5]),
      maxLoanAmount: parseEther(loan[6]),
      loanAmountDrawn: parseEther(loan[7]),
      firstBidTime: loan[8].toNumber(),
      lastBidTime: loan[9].toNumber(),
      historicInterest: loan[10].toNumber(),
      loanCompleteTime: loan[11].toNumber(),
    });
  }

  // Return loans (ordered by recency in creation)
  return loans.reverse();
}

// Return loan data
const loans = async (req: NextApiRequest, res: NextApiResponse) => {
  res.send(await collectAllLoans());
};

export default loans;
