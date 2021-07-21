NFT owner

1. Deposits NFT to contract
2. Provides duration of time to use NFT as collateral (D), fixed rate interest percent (F), and maximum loan amount (M)

3. Can pay back amount of loan at any time + interest to receive NFT and close loan
4. If defaulting, NFT is claimable by Bidder/Lender and NFT Owner can claim remaining capital

NFT bidder/lender

1. Can deposit any amount of capital up to M
2. If existing lender, must pay (1+F) _ D' _ Loan amount to update your new Loan amount

Note: tests don't test interest rate calculations implied in `calculateTotalInterest`.
