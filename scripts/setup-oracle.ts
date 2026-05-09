import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Get contract address from deployment.json
  const deploymentPath = path.join(__dirname, '../examples/shadowlens-frontend/deployment.json');
  
  if (!fs.existsSync(deploymentPath)) {
    console.error('❌ deployment.json not found. Please run deploy-shadowlens.ts first.');
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
  const contractAddress = deployment.contractAddress;

  console.log(`\n🔐 Setting up Oracle Authorization`);
  console.log(`📍 Contract: ${contractAddress}`);
  console.log(`👤 Oracle: ${deployer.address}\n`);

  // Get contract instance
  const ShadowLensAgentConsumer = await ethers.getContractFactory('ShadowLensAgentConsumer');
  const shadowLens = ShadowLensAgentConsumer.attach(contractAddress);

  // Set oracle
  console.log('⏳ Authorizing oracle...');
  const tx = await shadowLens.setOracle(deployer.address, true);
  const receipt = await tx.wait();

  console.log(`✅ Oracle authorized successfully!`);
  console.log(`📝 Transaction Hash: ${receipt?.hash}`);
  console.log(`📦 Block: ${receipt?.blockNumber}`);

  // Verify oracle was set
  const isAuthorized = await shadowLens.authorizedOracles(deployer.address);
  console.log(`\n✨ Verification: Oracle authorized = ${isAuthorized}`);

  if (isAuthorized) {
    console.log('\n🎉 Oracle setup complete! You can now fulfill analysis requests.');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
