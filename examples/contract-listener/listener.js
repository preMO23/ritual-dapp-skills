import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// For local testing, also load .env.local if it exists
if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}

// Validate required environment variables
if (!process.env.RPC_URL) {
  throw new Error("RPC_URL environment variable is required");
}
if (!process.env.CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS environment variable is required");
}
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is required");
}

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  [
    "event AnalysisRequested(bytes32 indexed requestId, address indexed requester, string handle)",
    "function fulfillAnalysis(bytes32 requestId, uint256 score, string reason)",
  ],
  provider,
);
console.log("Listening on contract:", process.env.CONTRACT_ADDRESS);
console.log("🟢 Infernet Listener Running...");

contract.on("AnalysisRequested", async (requestId, requester, handle) => {
  console.log("\n🔔 New Request Detected");
  console.log("RequestId:", requestId);
  console.log("Handle:", handle);

  // -------------------------
  // AI LOGIC (placeholder)
  // -------------------------
  const score = Math.floor(Math.random() * 100);
  const reason = `Auto analysis for ${handle}`;

  console.log("\n🧠 AI RESULT:", { score, reason });

  // -------------------------
  // CALLBACK TO CONTRACT
  // -------------------------
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const contractWithSigner = contract.connect(wallet);

  const tx = await contractWithSigner.fulfillAnalysis(requestId, score, reason);

  await tx.wait();

  console.log("✅ On-chain update complete");
});
