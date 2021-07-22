# PawNFT [Contracts]

`PawnBank.sol` issues PawnLoans that track all details about an individual loan. Users can `createLoan`, `underwriteLoan`, `drawLoan`, `repayLoan`, `cancelLoan`, or `seizeNFT`.

Dependencies: [ABDKMath64x64](https://github.com/abdk-consulting/abdk-libraries-solidity/blob/master/ABDKMath64x64.sol), [OpenZeppelin IERC721](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC721/IERC721.sol)

## Run locally

```bash
# Install dependencies
npm install

# Optional: compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy contracts to Rinkeby
npx hardhat run scripts/deploy.ts --network rinkeby
```

Note: Tests don't check interest rate calculations implied in `calculateTotalInterest`.
