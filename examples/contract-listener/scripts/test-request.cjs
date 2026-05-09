const { ethers } = require("hardhat");

async function main() {
  const [user] = await ethers.getSigners();

  // Read the contract address from .env.local
  const fs = require("fs");
  const envLocal = fs.readFileSync(".env.local", "utf8");
  const contractAddress = envLocal.split("=")[1].trim();

  const contract = await ethers.getContractAt(
    "ShadowLensProtocol",
    contractAddress,
  );

  console.log("Requesting analysis for @testuser...");

  const tx = await contract.requestAnalysis("@testuser");
  await tx.wait();

  console.log(
    "Analysis requested! The listener should pick it up and fulfill it.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
