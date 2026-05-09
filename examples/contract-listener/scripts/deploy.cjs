const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address;

  console.log("Deploying ShadowLensProtocol with oracle:", oracleAddress);
  console.log("Deploying contracts with the account:", deployer.address);

  const ShadowLens = await hre.ethers.getContractFactory("ShadowLensProtocol");
  const contract = await ShadowLens.deploy(oracleAddress);

  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("ShadowLens deployed to:", contractAddress);

  fs.writeFileSync(".env.local", `CONTRACT_ADDRESS=${contractAddress}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
