import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  encodeFunctionData,
  toHex,
} from 'viem';
import type { Address, Hex } from 'viem';

/**
 * ShadowLens HTTP Precompile Integration
 *
 * Demonstrates how to build and submit HTTPCallRequest payloads
 * for X API analysis via Ritual's HTTP precompile (0x0801).
 */

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: { name: 'RITUAL', symbol: 'RITUAL', decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'],
    },
  },
});

const HTTP_PRECOMPILE = '0x0000000000000000000000000000000000000801' as const;
const SHADOWLENS_ABI = [
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
] as const;

interface HTTPCallRequest {
  url: string;
  method: 0 | 1; // 0 = GET, 1 = POST
  headers: string[];
  body: string;
  executor: Address;
  timeout: number;
}

interface XApiAnalysisRequest {
  handle: string;
  weeklyMonitor?: boolean;
  includeEngagementMetrics?: boolean;
  includePostingPatterns?: boolean;
  includeContentRisk?: boolean;
}

/**
 * Encode an HTTPCallRequest for the Ritual HTTP precompile.
 *
 * @param request HTTPCallRequest parameters
 * @returns Encoded bytes for the precompile call
 */
export function encodeHttpCallRequest(request: HTTPCallRequest): Hex {
  // Basic HTTP precompile request encoding
  // Format: url_length (4 bytes) + url + method (1 byte) + executor (20 bytes) + timeout (4 bytes)
  //         headers_count (2 bytes) + [header_length + header]* + body_length (4 bytes) + body

  let encoded = '';

  // URL
  const urlBytes = Buffer.from(request.url, 'utf-8');
  encoded += urlBytes.length.toString(16).padStart(8, '0');
  encoded += urlBytes.toString('hex');

  // Method (0 = GET, 1 = POST)
  encoded += request.method.toString(16).padStart(2, '0');

  // Executor address (20 bytes)
  encoded += request.executor.slice(2).padStart(40, '0');

  // Timeout in seconds (4 bytes)
  encoded += request.timeout.toString(16).padStart(8, '0');

  // Headers
  encoded += request.headers.length.toString(16).padStart(4, '0');
  for (const header of request.headers) {
    const headerBytes = Buffer.from(header, 'utf-8');
    encoded += headerBytes.length.toString(16).padStart(4, '0');
    encoded += headerBytes.toString('hex');
  }

  // Body
  const bodyBytes = Buffer.from(request.body, 'utf-8');
  encoded += bodyBytes.length.toString(16).padStart(8, '0');
  encoded += bodyBytes.toString('hex');

  return ('0x' + encoded) as Hex;
}

/**
 * Build an X API request for shadow ban, engagement, and posting pattern analysis.
 *
 * @param xHandle The X (Twitter) username to analyze
 * @param bearerToken X API Bearer token
 * @returns HTTPCallRequest configured for X API user metrics
 */
export function buildXApiRequest(
  xHandle: string,
  bearerToken: string,
  executorAddress: Address
): HTTPCallRequest {
  const baseUrl = 'https://api.twitter.com/2/users/by/username';
  const url = `${baseUrl}/${xHandle}?user.fields=public_metrics,created_at,verified,protected`;

  return {
    url,
    method: 0, // GET
    headers: [
      `Authorization: Bearer ${bearerToken}`,
      'Content-Type: application/json',
      'Accept: application/json',
    ],
    body: '', // No body for GET request
    executor: executorAddress,
    timeout: 30, // 30 second timeout
  };
}

/**
 * Submit an X API analysis request to ShadowLens contract.
 *
 * @param config ShadowLens analysis request config
 * @param contractAddress ShadowLensAgentConsumer contract address
 * @param walletClient viem WalletClient instance (with account & signer)
 * @returns Transaction hash
 */
export async function submitXApiAnalysisRequest(
  config: XApiAnalysisRequest,
  contractAddress: Address,
  walletClient: ReturnType<typeof createWalletClient>,
  executorAddress: Address,
  bearerToken: string
): Promise<Hex> {
  const account = walletClient.account;
  if (!account) throw new Error('Wallet client must have an account');

  // Build X API request
  const xApiRequest = buildXApiRequest(config.handle, bearerToken, executorAddress);

  // Encode for HTTP precompile
  const encodedRequest = encodeHttpCallRequest(xApiRequest);

  // Encode contract call
  const data = encodeFunctionData({
    abi: SHADOWLENS_ABI,
    functionName: 'requestAnalysisWithHttp',
    args: [encodedRequest, config.handle, config.weeklyMonitor ?? false],
  });

  // Submit transaction
  const txHash = await walletClient.sendTransaction({
    to: contractAddress,
    data,
    account,
    gas: 500_000n, // Adjust based on precompile complexity
    maxFeePerGas: 1_000_000_000n, // 1 Gwei
    maxPriorityFeePerGas: 1_000_000n, // 0.001 Gwei
  });

  return txHash;
}

/**
 * Fetch executor address from Ritual TEEServiceRegistry.
 */
export async function getHttpExecutorAddress(
  publicClient: ReturnType<typeof createPublicClient>
): Promise<Address> {
  const TEE_SERVICE_REGISTRY = '0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F' as const;

  const TEE_SERVICE_REGISTRY_ABI = [
    {
      inputs: [
        { name: 'capability', type: 'uint8' },
        { name: 'checkValidity', type: 'bool' },
      ],
      name: 'getServicesByCapability',
      outputs: [
        {
          type: 'tuple[]',
          components: [
            {
              name: 'node',
              type: 'tuple',
              components: [
                { name: 'paymentAddress', type: 'address' },
                { name: 'teeAddress', type: 'address' },
                { name: 'teeType', type: 'uint8' },
                { name: 'publicKey', type: 'bytes' },
                { name: 'endpoint', type: 'string' },
                { name: 'certPubKeyHash', type: 'bytes32' },
                { name: 'capability', type: 'uint8' },
              ],
            },
            { name: 'isValid', type: 'bool' },
            { name: 'workloadId', type: 'bytes32' },
          ],
        },
      ],
      stateMutability: 'view',
      type: 'function',
    },
  ] as const;

  const HTTP_CALL_CAPABILITY = 0;

  const services = await publicClient.readContract({
    address: TEE_SERVICE_REGISTRY,
    abi: TEE_SERVICE_REGISTRY_ABI,
    functionName: 'getServicesByCapability',
    args: [HTTP_CALL_CAPABILITY, true],
  });

  if (services.length === 0) {
    throw new Error('No HTTP executors available');
  }

  return services[0].node.teeAddress;
}

export { ritualChain, HTTP_PRECOMPILE, SHADOWLENS_ABI };
