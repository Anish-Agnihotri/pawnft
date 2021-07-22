# PawnFT [Frontend]

[NextJS](https://nextjs.org) application as an interface to the contracts.

Currently depends on [Redis](https://redis.io/) as a metadata store (because I didn't have an OpenSea API key).

## Pruned structure

```bash
.
├── components
│   ├── Layout.tsx # Layout wrapper
│   └── LoanCard.tsx # Individual NFT cards
├── pages
│   ├── _app.tsx # Top-level
│   ├── _document.tsx # Inject fonts
│   ├── api # Utility back-end functions
│   ├── create.tsx # Create loan
│   ├── index.tsx # Landing
│   └── loan # Loan page
├── react-jazzicon.d.ts # React-Jazzicon types
├── state
│   ├── eth.ts # Network auth
│   ├── index.tsx
│   └── loan.ts # Contract functionality
└── utils
    ├── abi # ABIs
    ├── ethers.ts # Back-end RPC utilities
    └── types.ts # Custom types
```

## Run locally

Copy `.env.sample` to `.env.local` and populate environment variables.

```bash
# Install dependencies
npm install

# Run development environment
npm run dev
```
