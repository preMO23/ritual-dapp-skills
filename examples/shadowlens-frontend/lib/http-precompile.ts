import { encodeAbiParameters } from 'viem';

// HTTPCallRequest struct encoding for Ritual HTTP precompile
export interface HTTPCallRequest {
  url: string;
  method: number; // 0 = GET, 1 = POST, etc.
  headers: string[];
  body: string;
  executor: `0x${string}`;
  timeout: number;
}

export function encodeHttpCallRequest(request: HTTPCallRequest): `0x${string}` {
  // Encode the HTTPCallRequest struct
  // This matches the expected format for the Ritual HTTP precompile
  const encoded = encodeAbiParameters(
    [
      { name: 'url', type: 'string' },
      { name: 'method', type: 'uint8' },
      { name: 'headers', type: 'string[]' },
      { name: 'body', type: 'string' },
      { name: 'executor', type: 'address' },
      { name: 'timeout', type: 'uint32' },
    ],
    [
      request.url,
      request.method,
      request.headers,
      request.body,
      request.executor,
      request.timeout,
    ]
  );

  return encoded;
}

// For demo purposes - in production this would be the actual precompile call
export const HTTP_PRECOMPILE_ADDRESS = '0x0801' as const;
