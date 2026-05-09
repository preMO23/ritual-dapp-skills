const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Diagnostic: Checking account and chain state...\n");

  const [deployer] = await ethers.getSigners();
  const provider = ethers.provider;
  const network = await provider.getNetwork();

  console.log(`📝 Account: ${deployer.address}`);
  console.log(`🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);

  // Get account balance
  const balance = await provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  // Get transaction count (nonce)
  const nonce = await provider.getTransactionCount(deployer.address);
  console.log(`🔢 Nonce: ${nonce}`);

  // Get pending transactions
  const pendingNonce = await provider.getTransactionCount(
    deployer.address,
    "pending"
  );
  console.log(`⏳ Pending nonce: ${pendingNonce}`);

  // Try to get latest block
  try {
    const block = await provider.getBlock("latest");
    console.log(`📦 Latest block: ${block.number}`);
  } catch (e) {
    console.error(`❌ Could not get block: ${e.message}`);
  }

  // Check gas price
  try {
    const feeData = await provider.getFeeData();
    console.log(`⛽ Gas price: ${feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : "N/A"} gwei`);
  } catch (e) {
    console.error(`❌ Could not get gas price: ${e.message}`);
  }

  console.log(
    "\nℹ️  If nonce matches pending nonce, account is in sync."
  );
  console.log(
    "   If they differ, there may be stuck transactions in mempool."
  );
}

main();
