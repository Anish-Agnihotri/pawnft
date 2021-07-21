import { ethers } from "hardhat"; // Hardhat

async function main(): Promise<void> {
  // Collect deployer
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy PawnBank
  const PawnBank = await ethers.getContractFactory("PawnBank");
  const pawnbank = await PawnBank.deploy();

  console.log("Deployed PawnBank address:", pawnbank.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
