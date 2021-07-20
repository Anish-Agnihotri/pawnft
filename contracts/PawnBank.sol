//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

// ============ Imports ============

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// ============ Structs ============

struct PawnLoan {
  // NFT token address
  address tokenAddress;
  // NFT token owner (loan initiator)
  address tokenOwner;
  // Current top lender/bidder
  address lender;
  // NFT token id
  uint256 tokenId;
  // Fixed interest rate
  uint256 interestRate;
  // Current max bid
  uint256 loanAmount;
  // Maximum bid
  uint256 maxLoanAmount;
  // Current loan utilization
  uint256 loanAmountDrawn;
  // Timestamp of first bid
  uint256 firstBidTime;
  // Timestamp of last bid
  uint256 lastBidTime;
  // Interest paid by top bidder, thus far
  uint256 historicInterest;
  // Timestamp of loan completion
  uint256 loanCompleteTime;
  // Loan repaid status
  bool repaid;
}

contract PawnBank {
  // ============ Mutable storage ============

  // Number of loans issued
  uint256 public numLoans;
  // Mapping of loan number to loan struct
  mapping (uint256 => PawnLoan) public PawnLoans;

  // ============ Events ============

  // Loan creation event with indexed NFT owner
  event LoanCreated(
    uint256 id, 
    address indexed owner, 
    address tokenAddress, 
    uint256 tokenId, 
    uint256 maxLoanAmount, 
    uint256 loanCompleteTime
  );

  // ============ Functions ============

  /**
   * Enables an NFT owner to create a loan, specifying parameters.
   */
  function createLoan(
    address _tokenAddress,
    uint256 _tokenId,
    uint256 _interestRate,
    uint256 _maxLoanAmount,
    uint256 _loanCompleteTime
  ) external returns (uint256) {
    // NFT id
    uint256 loanId = numLoans;

    // Transfer NFT from owner to contract
    IERC721(_tokenAddress).transferFrom(msg.sender, address(this), _tokenId);

    // Create loan
    PawnLoans[loanId] = PawnLoan(
      _tokenAddress,
      msg.sender,
      address(0), // No lender
      _tokenId,
      _interestRate,
      0, // No current bid
      _maxLoanAmount,
      0, // 0 initial utilization
      0, // No first bid timestamp
      0, // No last bid timestamp
      0, // No historic interest
      _loanCompleteTime,
      false
    );

    // Increment number of loans
    numLoans++;

    // Emit creation event
    emit LoanCreated(
      loanId, 
      msg.sender, 
      _tokenAddress, 
      _tokenId, 
      _maxLoanAmount, 
      _loanCompleteTime
    );

    // Return loan id
    return loanId;
  }

  function _calculateInterestAccrued(PawnLoan memory loan) internal returns (uint256) {
    return 0;
          /*uint256 _lenderPayment = (
        (
          (block.timestamp - loan.lastBidTime) / 
          (loan.maxLoanTime - loan.firstBidTime)
        ) 
        * (100 + loan.interestRate)
      ) / 100;*/
  }

  function underwriteLoan(uint256 _loanId) payable external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // Prevent underwriting a repaid loan
    require(!loan.repaid, "PawnBank: Cannot underwrite a repaid loan.");
    // Prevent underwriting an expired loan
    require(block.timestamp < loan.loanCompleteTime, "PawnBank: Cannot underwrite an expired loan.");
    // Prevent underwriting with 0 value
    require(msg.value > 0, "PawnBank: Cannot underwrite loan with 0 Ether");
    // Prevent underwriting with value under current top bid
    require(msg.value > loan.loanAmount, "PawnBank: Cannot underwrite loan with less than top lender.");
    // Prevent underwriting with value greater than max bid
    require(msg.value <= loan.maxLoanAmount, "PawnBank: Cannot underwrite loan with more than max loan amount.");

    // If loan has a previous bid:
    if (loan.firstBidTime != 0) {
      // Calculate interest to pay to current bidder
      uint256 _interestToPay = _calculateInterestAccrued(loan);
      // Calculate payout for last bidder
      uint256 _bidPayout = loan.loanAmount + loan.historicInterest + _interestToPay;
      // Buyout current top bidder
      (bool sent,) = payable(loan.lender).call{value: _bidPayout}("");
      require(sent, "Failed to send");

      // Increment historic paid interest
      loan.historicInterest += _interestToPay;
    } else {
      // If loan doesn't have a previous bid, set first bid time
      loan.firstBidTime = block.timestamp;
    }

    // Update new lender address
    loan.lender = msg.sender;
    // Update new loan amount
    loan.loanAmount = msg.value;
    // Update last bid time
    loan.lastBidTime = block.timestamp;
  }

  function drawLoan(uint256 _loanId) external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // 
    require(!loan.repaid, "PawnBank: Cannot draw against a repaid loan.");
    require(loan.tokenOwner == msg.sender, "PawnBank: Must be NFT owner to draw loan.");
    require(loan.firstBidTime != 0, "PawnBank: No capacity to draw loan.");
    require(loan.loanAmountDrawn < loan.loanAmount, "PawnBank: Max loan draw capacity reached.");

    (bool sent,) = payable(msg.sender).call{value: loan.loanAmount - loan.loanAmountDrawn}("");
    require(sent, "Failed to send");

    loan.loanAmountDrawn = loan.loanAmount;
  }

  function repayLoan(uint256 _loanId) payable external {
    PawnLoan storage loan = PawnLoans[_loanId];
    require(!loan.repaid, "PawnBank: Cannot repay a paid loan.");
    require(loan.firstBidTime != 0, "");

    uint256 _debt = loan.lastBidInterest + _calculateInterestAccrued(loan) + loan.loanAmount;
    (bool sent,) = payable(loan.lender).call{value: _debt}("");
    require(sent, "Failed to send");
    IERC721(loan.tokenAddress).transferFrom(address(this), loan.tokenOwner, loan.tokenId);
  }

  function cancelLoan(uint256 _loanId) external {
    PawnLoan storage loan = PawnLoans[_loanId];
    require(msg.sender == loan.tokenOwner, "");
    IERC721(loan.tokenAddress).transferFrom(address(this), msg.sender, loan.tokenId);
  }

  function seizeNFT() public {}
}