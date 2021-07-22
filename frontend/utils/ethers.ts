import { ethers } from "ethers"; // Ethers
import { PAWN_BANK_ADDRESS } from "@state/loan"; // Pawn Bank deployment
import { PawnBankABI } from "@utils/abi/PawnBank"; // Pawn Bank ABI

// Export PawnBank contract w/ RPC
export const PawnBankRPC = new ethers.Contract(
  PAWN_BANK_ADDRESS,
  PawnBankABI,
  new ethers.providers.JsonRpcProvider(
    `https://rinkeby.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_RPC}`,
    4
  )
);
