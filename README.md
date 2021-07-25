<img src="https://www.pawnft.co/vectors/logo.svg" width="50" />

# PawNFT

NFT-collateralized lending, inspired by conversations with [Mark Beylin](https://twitter.com/MarkBeylin/status/1416959609143808003).

### Credits

See @wilsoncusack's [similar implementation](https://github.com/wilsoncusack/nft-pawn-shop-solidity), predating this one.

Thank you to [@mrthankyou](https://github.com/mrthankyou) for volunteering to independently audit, and [@wilsoncusack](https://github.com/wilsoncusack) and [@vasa-develop](https://github.com/vasa-develop) for their feedback.

### Context

Non-fungible assets are difficult to price effectively, limiting their ability to be used as a form of collateral. Thus far, NFT-lending (see: [nftfi](https://nftfi.com/)) has been largely p2p with NFT owners proposing fixed loan requirements and terms, upfront.

PawNFT uses an active auction mechanism to achieve three results:

1. Better price discovery for non-fungible assets through locked top bids
2. Ability to draw capital against NFT collateral, through active bids
3. Fixed-term, fixed-interest rewards for lenders

For NFT owners, PawNFT offers either: (1) a way to draw capital against their non-fungible collateral, or (2) a short-dated put on the price of their NFT (with the premium paid being the fixed interest to top bidder).

This implementation closely follows [Mark's spec](https://twitter.com/MarkBeylin/status/1416979784886886402?s=20), save for adding cascading interest payments aross subsequent lenders (Mark's spec forces worst rates for future lenders).

## Run locally

Contract code is found in `/contracts` and is a [Hardhat](https://hardhat.org/) project.

Front-end code is found in `/frontend` and is a [NextJS](https://nextjs.org) application.

READMEs in resepective subfolders cover details.

## License

GPL-3.0-or-later
