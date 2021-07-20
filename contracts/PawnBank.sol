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
  // New loan lender/bidder
  event LoanUnderwritten(uint256 id, address lender);
  // Loan drawn by NFT owner
  event LoanDrawn(uint256 id);
  // Loan repayed by address
  event LoanRepayed(uint256 id, address lender, address repayer);
  // Loan cancelled by NFT owner
  event LoanCancelled(uint256 id);
  // NFT seized by lender
  event LoanSeized(uint256 id, address lender, address caller);

  // ============ Functions ============

  /**
   * Enables an NFT owner to create a loan, specifying parameters
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

  /**
   * Calculates interest accrued for a particular lender
   */
  function _calculateInterestAccrued(PawnLoan memory loan) view public returns (uint256) {
    return (
        // Time elapsed since bid placed
        (block.timestamp - loan.lastBidTime) /
        // Total time loan will stay active
        (loan.loanCompleteTime - loan.firstBidTime)
      ) * loan.loanAmount * (loan.interestRate / 100);
  }

  /**
   * Enables a lender/bidder to underwrite a loan, given it is the top bid
   */
  function underwriteLoan(uint256 _loanId) payable external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // Prevent underwriting with 0 value
    require(msg.value > 0, "PawnBank: Cannot underwrite loan with 0 Ether.");
    // Prevent underwriting a repaid loan
    require(loan.repaid == false, "PawnBank: Cannot underwrite a repaid loan.");
    // Prevent underwriting an expired loan
    require(loan.loanCompleteTime >= block.timestamp,
      "PawnBank: Cannot underwrite an expired loan."
    );
    // Prevent underwriting a loan with value < current top bid
    require(loan.loanAmount < msg.value, 
      "PawnBank: Cannot underwrite loan with less than top lender."
    );
    // Prevent underwriting a loan with value greater than max bid
    require(loan.maxLoanAmount >= msg.value, 
      "PawnBank: Cannot underwrite loan with more than max loan amount."
    );

    // If loan has a previous bid:
    if (loan.firstBidTime != 0) {
      // Calculate interest to pay to previous bidder
      uint256 _interestToPay = _calculateInterestAccrued(loan);
      // Calculate total payout for previous bidder
      uint256 _bidPayout = loan.loanAmount + loan.historicInterest + _interestToPay;
      // Buyout current top bidder
      (bool sent,) = payable(loan.lender).call{value: _bidPayout}("");
      require(sent == true, "PawnBank: Failed to buyout top bidder.");

      // Increment historic paid interest
      loan.historicInterest += _interestToPay;
    } else {
      // If loan doesn't have a previous bid (to buyout), set first bid time
      loan.firstBidTime = block.timestamp;
    }

    // Update new lender address
    loan.lender = msg.sender;
    // Update new loan amount
    loan.loanAmount = msg.value;
    // Update last bid time
    loan.lastBidTime = block.timestamp;

    // Emit new underwriting event
    emit LoanUnderwritten(_loanId, msg.sender);
  }

  /**
   * Enables NFT owner to draw capital from top bid
   */
  function drawLoan(uint256 _loanId) external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // Prevent drawing from a loan without bids
    require(loan.firstBidTime != 0, "PawnBank: No capacity to draw loan.");
    // Prevent drawing from a repaid loan
    require(loan.repaid == false, "PawnBank: Cannot draw against a repaid loan.");
    // Prevent non-loan-owner from drawing
    require(loan.tokenOwner == msg.sender, "PawnBank: Must be NFT owner to draw loan.");
    // Prevent drawing from a loan with 0 available capital
    require(loan.loanAmountDrawn < loan.loanAmount, "PawnBank: Max draw capacity reached.");

    // Draw the maximum available loan capital
    (bool sent,) = payable(msg.sender).call{value: loan.loanAmount - loan.loanAmountDrawn}("");
    require(sent == true, "PawnBank: Failed to draw available capital.");

    // Update drawn amount to current loan capacity
    loan.loanAmountDrawn = loan.loanAmount;

    // Emit draw event
    emit LoanDrawn(_loanId);
  }

  /**
   * Enables anyone to repay a loan on behalf of owner
   */
  function repayLoan(uint256 _loanId) payable external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // Prevent repaying repaid loan
    require(loan.repaid == false, "PawnBank: Cannot repay a paid loan.");
    // Prevent repaying loan without bids
    require(loan.firstBidTime != 0, "PawnBank: Cannot repay a loan with no bids.");
    // Prevent repaying loan after expiry
    require(loan.loanCompleteTime >= block.timestamp, "PawnBank: Cannot repay expired loan.");

    // Calculate interest to pay to current bidder
    uint256 _interestToPay = _calculateInterestAccrued(loan);
    // Calculate payout for current bidder
    uint256 _bidPayout = loan.loanAmount + loan.historicInterest + _interestToPay;
    // Calculate additional required capital to process payout
    uint256 _additionalCapital = _bidPayout - loan.loanAmountDrawn;
    // Enforce additional required capital is passed to contract
    require(msg.value >= _additionalCapital, "PawnBank: Insufficient repayment.");

    // Payout current bidder
    (bool sent,) = payable(loan.lender).call{value: _bidPayout}("");
    require(sent == true, "PawnBank: Failed to repay loan.");

    // Transfer NFT back to owner
    IERC721(loan.tokenAddress).transferFrom(address(this), loan.tokenOwner, loan.tokenId);

    // Toggle loan repayment
    loan.repaid = true;

    // Emit repayment event
    emit LoanRepayed(_loanId, loan.lender, msg.sender);
  }

  /**
   * Enables owner to cancel loan (assuming no bids placed)
   */
  function cancelLoan(uint256 _loanId) external {
    PawnLoan storage loan = PawnLoans[_loanId];
    // Enforce loan is unpaid
    require(loan.repaid == false, "PawnBank: Cannot cancel repaid loan.");
    // Enforce loan ownership
    require(loan.tokenOwner == msg.sender, "PawnBank: Must be owner to cancel loan.");
    // Enforce loan has no bids
    require(loan.firstBidTime == 0, "PawnBank: Cannot cancel loan with existing bids.");

    // Return NFT to owner
    IERC721(loan.tokenAddress).transferFrom(address(this), msg.sender, loan.tokenId);

    // Nullify loan
    loan.repaid = true;

    // Emit cancelleation event
    emit LoanCancelled(_loanId);
  }

  /**
   * Enables anyone to seize NFT, for lender, on loan default
   */
  function seizeNFT(uint256 _loanId) external {
    PawnLoan memory loan = PawnLoans[_loanId];
    // Enforce loan is unpaid
    require(loan.repaid == false, "PawnBank: Cannot seize NFT from repaid loan.");
    // Enforce loan is expired
    require(loan.loanCompleteTime < block.timestamp, "PawnBank: Cannot seize NFT before loan expiry.");

    // Transfer NFT to lender
    IERC721(loan.tokenAddress).transferFrom(address(this), loan.lender, loan.tokenId);

    // Emit seize event
    emit LoanSeized(_loanId, loan.lender, msg.sender);
  }
}