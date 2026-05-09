const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ShadowLensAgentConsumer to Ritual Chain...\n");

  // Get deployer
  const [deployer, ...otherSigners] = await ethers.getSigners();
  console.log(`📝 Primary deployer: ${deployer.address}`);
  console.log(`📝 Other signers available: ${otherSigners.length}`);

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log(`🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);

  if (network.chainId !== 1979) {
    console.warn(
      "⚠️  Warning: This deployment is intended for Ritual Chain (1979), but you are connected to chain",
      network.chainId
    );
  }

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);

  // Get nonce
  const nonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log(`🔢 Current nonce: ${nonce}\n`);

  try {
    // Deploy contract
    console.log("📦 Deploying contract...");
    const ShadowLensAgentConsumer = await ethers.getContractFactory(
      "ShadowLensAgentConsumer"
    );

    const shadowLens = await ShadowLensAgentConsumer.deploy();
    console.log(
      `⏳ Waiting for transaction: ${shadowLens.deploymentTransaction().hash}`
    );

    const receipt = await shadowLens.waitForDeployment();
    const contractAddress = await shadowLens.getAddress();

    console.log("✅ ShadowLensAgentConsumer deployed successfully!");
    console.log(`📍 Contract Address: ${contractAddress}\n`);

    // Get owner
    const owner = await shadowLens.owner();
    console.log(`👤 Owner: ${owner}`);

    // Save deployment info
    const deploymentInfo = {
      network: network.name,
      chainId: network.chainId,
      contractAddress,
      deployer: deployer.address,
      owner,
      deploymentTime: new Date().toISOString(),
      transactionHash: shadowLens.deploymentTransaction().hash,
      constants: {
        SOVEREIGN_AGENT: await shadowLens.SOVEREIGN_AGENT(),
        HTTP_PRECOMPILE: await shadowLens.HTTP_PRECOMPILE(),
        ASYNC_DELIVERY: await shadowLens.ASYNC_DELIVERY(),
      },
    };

    const deploymentPath = path.join(
      __dirname,
      "../shadowlens-frontend/.env.local"
    );
    const envContent = `NEXT_PUBLIC_SHADOWLENS_ADDRESS=${contractAddress}
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id_here
`;

    // Create .env.local if it doesn't exist
    const frontendEnvDir = path.join(__dirname, "../shadowlens-frontend");
    if (!fs.existsSync(frontendEnvDir)) {
      fs.mkdirSync(frontendEnvDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, envContent);
    console.log(`\n📄 Frontend .env.local created at: ${deploymentPath}`);

    // Save deployment JSON
    const deploymentJson = path.join(
      __dirname,
      "../shadowlens-frontend/deployment.json"
    );
    fs.writeFileSync(deploymentJson, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved to: ${deploymentJson}`);

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Owner: ${owner}`);
    console.log(`Network: ${network.name} (${network.chainId})`);
    console.log(`Timestamp: ${deploymentInfo.deploymentTime}`);
    console.log(
      `Transaction: https://explorer.ritualfoundation.org/tx/${deploymentInfo.transactionHash}`
    );
    console.log("\n🔗 Precompile Addresses:");
    console.log(
      `  - Sovereign Agent: ${deploymentInfo.constants.SOVEREIGN_AGENT}`
    );
    console.log(
      `  - HTTP Precompile: ${deploymentInfo.constants.HTTP_PRECOMPILE}`
    );
    console.log(`  - AsyncDelivery: ${deploymentInfo.constants.ASYNC_DELIVERY}`);
    console.log("=".repeat(60));

    console.log("\n✨ Next steps:");
    console.log(
      "1. Update NEXT_PUBLIC_WC_PROJECT_ID in .env.local with your WalletConnect ID"
    );
    console.log("2. Update your backend listener with the contract address");
    console.log(
      "3. Start the frontend: cd ../shadowlens-frontend && npm install && npm run dev"
    );
    console.log(
      "4. Start the backend listener: npx ts-node ../shadowlens-x-api/listener.ts\n"
    );
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(`Error: ${error.message}`);

    // Check if this is a nonce issue
    if (error.message.includes("already known")) {
      console.error(
        "\n💡 This appears to be a nonce issue. The RPC has seen this nonce before."
      );
      console.error("   Possible solutions:");
      console.error("   1. Wait a few minutes and retry");
      console.error("   2. Use a different account/private key");
      console.error("   3. Check if the contract was already deployed");
    }

    process.exit(1);
  }
}

main();

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
