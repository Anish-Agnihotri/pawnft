// Export ABI for PawnBank contract
export const PawnBankABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "LoanCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "maxLoanAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "loanCompleteTime",
        type: "uint256",
      },
    ],
    name: "LoanCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
    ],
    name: "LoanDrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "lender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "repayer",
        type: "address",
      },
    ],
    name: "LoanRepayed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "lender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "caller",
        type: "address",
      },
    ],
    name: "LoanSeized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "id",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "lender",
        type: "address",
      },
    ],
    name: "LoanUnderwritten",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "future",
        type: "uint256",
      },
    ],
    name: "calculateInterestAccrued",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "future",
        type: "uint256",
      },
    ],
    name: "calculateRequiredRepayment",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "future",
        type: "uint256",
      },
    ],
    name: "calculateTotalInterest",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
    ],
    name: "cancelLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_tokenAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_interestRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_maxLoanAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_loanCompleteTime",
        type: "uint256",
      },
    ],
    name: "createLoan",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
    ],
    name: "drawLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "numLoans",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "pawnLoans",
    outputs: [
      {
        internalType: "address",
        name: "tokenAddress",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenOwner",
        type: "address",
      },
      {
        internalType: "address",
        name: "lender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "interestRate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "loanAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxLoanAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "loanAmountDrawn",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "firstBidTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastBidTime",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "historicInterest",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "loanCompleteTime",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
    ],
    name: "repayLoan",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
    ],
    name: "seizeNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_loanId",
        type: "uint256",
      },
    ],
    name: "underwriteLoan",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
