import { parseAbi } from 'viem';

export const SHADOWLENS_ABI = parseAbi([
  {
    inputs: [
      { name: 'httpInput', type: 'bytes' },
      { name: 'handle', type: 'string' },
      { name: 'weeklyMonitor', type: 'bool' },
    ],
    name: 'requestAnalysisWithHttp',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'precompileInput', type: 'bytes' },
      { name: 'handle', type: 'string' },
      { name: 'weeklyMonitor', type: 'bool' },
    ],
    name: 'requestAnalysisWithAgent',
    outputs: [{ name: '', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    name: 'analyses',
    outputs: [
      { name: 'requestId', type: 'bytes32' },
      { name: 'requester', type: 'address' },
      { name: 'handle', type: 'string' },
      { name: 'riskLevel', type: 'uint8' },
      { name: 'engagementHealth', type: 'string' },
      { name: 'postingPattern', type: 'string' },
      { name: 'contentRisk', type: 'string' },
      { name: 'suggestedFixes', type: 'string' },
      { name: 'weeklyMonitor', type: 'bool' },
      { name: 'status', type: 'uint8' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'requestId', type: 'bytes32' }],
    name: 'monitorCadenceSeconds',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'requestId', type: 'bytes32' },
      { name: 'cadenceSeconds', type: 'uint256' },
    ],
    name: 'scheduleWeeklyMonitor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'bytes32' },
      { indexed: true, name: 'requester', type: 'address' },
      { indexed: false, name: 'handle', type: 'string' },
      { indexed: false, name: 'weeklyMonitor', type: 'bool' },
    ],
    name: 'AnalysisRequested',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'requestId', type: 'bytes32' },
      { indexed: false, name: 'riskLevel', type: 'uint8' },
      { indexed: false, name: 'engagementHealth', type: 'string' },
      { indexed: false, name: 'postingPattern', type: 'string' },
      { indexed: false, name: 'contentRisk', type: 'string' },
      { indexed: false, name: 'suggestedFixes', type: 'string' },
    ],
    name: 'AnalysisCompleted',
    type: 'event',
  },
]);

export const SHADOWLENS_ADDRESS = process.env.NEXT_PUBLIC_SHADOWLENS_ADDRESS || '0x0000000000000000000000000000000000000000';

export type RiskLevel = 0 | 1 | 2 | 3; // 0 = Unknown, 1 = Low, 2 = Medium, 3 = High

export interface Analysis {
  requestId: `0x${string}`;
  requester: `0x${string}`;
  handle: string;
  riskLevel: RiskLevel;
  engagementHealth: string;
  postingPattern: string;
  contentRisk: string;
  suggestedFixes: string;
  weeklyMonitor: boolean;
  status: 0 | 1; // 0 = Pending, 1 = Completed
  createdAt: bigint;
  updatedAt: bigint;
}

export const RISK_LEVEL_LABELS = {
  0: 'Unknown',
  1: 'Low',
  2: 'Medium',
  3: 'High',
} as const;

export const RISK_LEVEL_COLORS = {
  0: 'text-gray-500',
  1: 'text-green-600',
  2: 'text-yellow-600',
  3: 'text-red-600',
} as const;
