import { createPublicClient, createWalletClient, http, privateKeyToAccount, encodeFunctionData, parseAbi, decodeEventLog } from 'viem';
import * as dotenv from 'dotenv';
import { analyzeXHandle } from './example-workflow.js';
import { ritualChain } from './shadowlens-http-precompile.js';
import type { Address, Hex } from 'viem';

dotenv.config();

const CONTRACT_ADDRESS = (process.env.SHADOWLENS_CONTRACT_ADDRESS as Address) || '';
const RPC_URL = process.env.RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org';
const ORACLE_PRIVATE_KEY = process.env.FULFILLING_PRIVATE_KEY || process.env.RITUAL_PRIVATE_KEY || '';
const X_API_BEARER_TOKEN = process.env.X_API_BEARER_TOKEN || '';
const POLLING_INTERVAL = Number(process.env.POLLING_INTERVAL_MS || 15000);

if (!CONTRACT_ADDRESS) {
  throw new Error('SHADOWLENS_CONTRACT_ADDRESS is required in .env');
}
if (!ORACLE_PRIVATE_KEY) {
  throw new Error('FULFILLING_PRIVATE_KEY or RITUAL_PRIVATE_KEY is required in .env');
}
if (!X_API_BEARER_TOKEN) {
  throw new Error('X_API_BEARER_TOKEN is required in .env');
}

const ANALYSIS_REQUESTED_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { indexed: true, internalType: 'address', name: 'requester', type: 'address' },
      { indexed: false, internalType: 'string', name: 'handle', type: 'string' },
      { indexed: false, internalType: 'bool', name: 'weeklyMonitor', type: 'bool' },
    ],
    name: 'AnalysisRequested',
    type: 'event',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'requestId', type: 'bytes32' }],
    name: 'analyses',
    outputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'address', name: 'requester', type: 'address' },
      { internalType: 'string', name: 'handle', type: 'string' },
      { internalType: 'uint8', name: 'riskLevel', type: 'uint8' },
      { internalType: 'string', name: 'engagementHealth', type: 'string' },
      { internalType: 'string', name: 'postingPattern', type: 'string' },
      { internalType: 'string', name: 'contentRisk', type: 'string' },
      { internalType: 'string', name: 'suggestedFixes', type: 'string' },
      { internalType: 'bool', name: 'weeklyMonitor', type: 'bool' },
      { internalType: 'uint8', name: 'status', type: 'uint8' },
      { internalType: 'uint256', name: 'createdAt', type: 'uint256' },
      { internalType: 'uint256', name: 'updatedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
      { internalType: 'uint8', name: 'riskLevel', type: 'uint8' },
      { internalType: 'string', name: 'engagementHealth', type: 'string' },
      { internalType: 'string', name: 'postingPattern', type: 'string' },
      { internalType: 'string', name: 'contentRisk', type: 'string' },
      { internalType: 'string', name: 'suggestedFixes', type: 'string' },
    ],
    name: 'fulfillAnalysis',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const contractAbi = parseAbi(ANALYSIS_REQUESTED_ABI);

const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(RPC_URL),
});

const walletClient = createWalletClient({
  chain: ritualChain,
  transport: http(RPC_URL),
  account: privateKeyToAccount(ORACLE_PRIVATE_KEY),
});

async function getLastBlock(): Promise<bigint> {
  return publicClient.getBlockNumber();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAnalysisState(requestId: string) {
  return publicClient.readContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: 'analyses',
    args: [requestId as Hex],
  });
}

async function fulfillOnChain(requestId: string, analysis: { riskLevel: 0 | 1 | 2 | 3; engagementHealth: string; postingPattern: string; contentRisk: string; suggestedFixes: string; }) {
  const data = encodeFunctionData({
    abi: contractAbi,
    functionName: 'fulfillAnalysis',
    args: [requestId as Hex, analysis.riskLevel, analysis.engagementHealth, analysis.postingPattern, analysis.contentRisk, analysis.suggestedFixes],
  });

  const tx = await walletClient.sendTransaction({
    account: walletClient.account,
    to: CONTRACT_ADDRESS,
    data,
    maxFeePerGas: 1_500_000_000n,
    maxPriorityFeePerGas: 1_000_000_000n,
    gas: 500_000n,
  });
  console.log(`✅ fulfillAnalysis tx submitted: ${tx}`);
}

async function processRequest(requestId: string, handle: string, weeklyMonitor: boolean) {
  console.log(`\n🔔 New ShadowLens request: ${requestId}`);
  console.log(`   handle=${handle} weeklyMonitor=${weeklyMonitor}`);

  const analysisState = await fetchAnalysisState(requestId);
  if (analysisState.status !== 0) {
    console.log('   ▶ already completed or processed; skipping');
    return;
  }

  console.log('   ▶ fetching X metrics and doing analysis...');
  const analysisResult = await analyzeXHandle(handle, X_API_BEARER_TOKEN);

  console.log('   ▶ fulfilling analysis on-chain');
  await fulfillOnChain(requestId, analysisResult);
}

async function scanForEvents() {
  let fromBlock = await getLastBlock();
  console.log(`Starting listener at block ${fromBlock}`);

  while (true) {
    try {
      const toBlock = await getLastBlock();
      if (toBlock < fromBlock) {
        fromBlock = toBlock;
      }

      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        eventName: 'AnalysisRequested',
        fromBlock,
        toBlock,
      });

      for (const log of logs) {
        const decoded = decodeEventLog({
          abi: contractAbi,
          data: log.data,
          topics: log.topics,
          strict: true,
        });

        const requestId = decoded.requestId as string;
        const handle = decoded.handle as string;
        const weeklyMonitor = decoded.weeklyMonitor as boolean;

        await processRequest(requestId, handle, weeklyMonitor);
      }

      fromBlock = toBlock + 1n;
    } catch (error) {
      console.error('Listener error:', error);
    }

    await sleep(POLLING_INTERVAL);
  }
}

async function run() {
  console.log('ShadowLens backend listener starting...');
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC: ${RPC_URL}`);
  await scanForEvents();
}

run().catch((error) => {
  console.error('Fatal listener error:', error);
  process.exit(1);
});
