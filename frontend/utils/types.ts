// Base NFT Loan
export interface Loan {
  // Retrievable id
  loanId: number;
  // NFT token address
  tokenAddress: string;
  // NFT token original owner
  tokenOwner: string;
  // Current lender
  lender: string;
  // NFT token id
  tokenId: number;
  // Fixed interest rate
  interestRate: number;
  // Currently raised loan amount
  loanAmount: number;
  // Bid ceiling
  maxLoanAmount: number;
  // Currently drawn loan amount
  loanAmountDrawn: number;
  // Timestamp of first bid
  firstBidTime: number;
  // Timestamp of last bid
  lastBidTime: number;
  // Historic interest accrued
  historicInterest: number;
  // Timestamp of loan completion
  loanCompleteTime: number;
}

// Loan w/ added Metadata to render card
export interface LoanWithMetadata extends Loan {
  // NFT image
  imageURL: string;
  // NFT name
  name: string;
  // NFT description
  description: string;
}
