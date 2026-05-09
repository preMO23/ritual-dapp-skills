import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('🚀 Deploying ShadowLensAgentConsumer to Ritual Chain...\n');

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log(`📝 Deploying with account: ${deployer.address}`);

  // Check network
  const network = await ethers.provider.getNetwork();
  console.log(`🔗 Network: ${network.name} (Chain ID: ${network.chainId})`);

  if (network.chainId !== 1979) {
    console.warn('⚠️  Warning: This deployment is intended for Ritual Chain (1979), but you are connected to chain', network.chainId);
  }

  // Get balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH\n`);

  // Deploy contract
  const ShadowLensAgentConsumer = await ethers.getContractFactory('ShadowLensAgentConsumer');
  const shadowLens = await ShadowLensAgentConsumer.deploy();

  await shadowLens.waitForDeployment();
  const contractAddress = await shadowLens.getAddress();

  console.log('✅ ShadowLensAgentConsumer deployed successfully!');
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
    constants: {
      SOVEREIGN_AGENT: await shadowLens.SOVEREIGN_AGENT(),
      HTTP_PRECOMPILE: await shadowLens.HTTP_PRECOMPILE(),
      ASYNC_DELIVERY: await shadowLens.ASYNC_DELIVERY(),
    },
  };

  const deploymentPath = path.join(__dirname, '../examples/shadowlens-frontend/.env.local');
  const envContent = `NEXT_PUBLIC_SHADOWLENS_ADDRESS=${contractAddress}
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id_here
`;

  // Create .env.local if it doesn't exist
  const frontendEnvDir = path.join(__dirname, '../examples/shadowlens-frontend');
  if (!fs.existsSync(frontendEnvDir)) {
    fs.mkdirSync(frontendEnvDir, { recursive: true });
  }

  fs.writeFileSync(deploymentPath, envContent);
  console.log(`\n📄 Frontend .env.local created at: ${deploymentPath}`);

  // Save deployment JSON
  const deploymentJson = path.join(__dirname, '../examples/shadowlens-frontend/deployment.json');
  fs.writeFileSync(deploymentJson, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📄 Deployment info saved to: ${deploymentJson}`);

  // Display summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Owner: ${owner}`);
  console.log(`Network: ${network.name} (${network.chainId})`);
  console.log(`Timestamp: ${deploymentInfo.deploymentTime}`);
  console.log('\n🔗 Precompile Addresses:');
  console.log(`  - Sovereign Agent: ${deploymentInfo.constants.SOVEREIGN_AGENT}`);
  console.log(`  - HTTP Precompile: ${deploymentInfo.constants.HTTP_PRECOMPILE}`);
  console.log(`  - AsyncDelivery: ${deploymentInfo.constants.ASYNC_DELIVERY}`);
  console.log('='.repeat(60));

  console.log('\n✨ Next steps:');
  console.log('1. Update NEXT_PUBLIC_WC_PROJECT_ID in .env.local with your WalletConnect ID');
  console.log('2. Update your backend listener with the contract address');
  console.log('3. Start the frontend: cd examples/shadowlens-frontend && npm run dev');
  console.log('4. Start the backend listener: npx ts-node examples/shadowlens-x-api/listener.ts\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
\