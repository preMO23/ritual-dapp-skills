const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ShadowLensAgentConsumer (Nonce-aware)...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deployer: ${deployer.address}`);

  const network = await ethers.provider.getNetwork();
  console.log(`🔗 Network: ${network.name} (Chain ID: ${network.chainId})\n`);

  // Get current nonce and bump it
  const currentNonce = await ethers.provider.getTransactionCount(deployer.address);
  console.log(`🔢 Current nonce: ${currentNonce}`);
  console.log(`🔢 Using nonce: ${currentNonce + 1}`);

  try {
    const ShadowLensAgentConsumer = await ethers.getContractFactory(
      "ShadowLensAgentConsumer"
    );

    // Deploy with explicit nonce
    const tx = await deployer.sendTransaction({
      data: ShadowLensAgentConsumer.bytecode,
      nonce: currentNonce + 1,
    });

    console.log(`\n⏳ Transaction hash: ${tx.hash}`);
    console.log(`⏳ Waiting for confirmation...`);

    const receipt = await tx.wait();
    const contractAddress = receipt.contractAddress;

    console.log(`\n✅ Contract deployed to: ${contractAddress}`);

    // Get contract instance
    const shadowLens = ShadowLensAgentConsumer.attach(contractAddress);
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
      transactionHash: tx.hash,
      constants: {
        SOVEREIGN_AGENT: await shadowLens.SOVEREIGN_AGENT(),
        HTTP_PRECOMPILE: await shadowLens.HTTP_PRECOMPILE(),
        ASYNC_DELIVERY: await shadowLens.ASYNC_DELIVERY(),
      },
    };

    // Create env files
    const deploymentPath = path.join(
      __dirname,
      "../shadowlens-frontend/.env.local"
    );
    const envContent = `NEXT_PUBLIC_SHADOWLENS_ADDRESS=${contractAddress}
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id_here
`;

    const frontendEnvDir = path.join(__dirname, "../shadowlens-frontend");
    if (!fs.existsSync(frontendEnvDir)) {
      fs.mkdirSync(frontendEnvDir, { recursive: true });
    }

    fs.writeFileSync(deploymentPath, envContent);
    console.log(`\n📄 Frontend .env.local created`);

    const deploymentJson = path.join(
      __dirname,
      "../shadowlens-frontend/deployment.json"
    );
    fs.writeFileSync(deploymentJson, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved`);

    console.log("\n" + "=".repeat(60));
    console.log("✨ DEPLOYMENT SUCCESSFUL");
    console.log("=".repeat(60));
    console.log(`Contract: ${contractAddress}`);
    console.log(`TxHash: ${tx.hash}`);
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error(error.message);
    process.exit(1);
  }
}

main();
