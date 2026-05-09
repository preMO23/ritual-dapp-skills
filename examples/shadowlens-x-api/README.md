# ShadowLens X API Integration

Demonstrates how to use Ritual's HTTP precompile (`0x0801`) to fetch X (Twitter) API data and submit ShadowLens analysis requests on-chain.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend / Backend                                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. User enters X handle to analyze                              │
│ 2. Build HTTPCallRequest for X API endpoints                    │
│ 3. Sign & submit tx to ShadowLensAgentConsumer (0x0801)        │
│ 4. Ritual executor fetches X API data                           │
│ 5. Parse response → structured analysis on-chain                │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Ritual Chain (1979)                                             │
├─────────────────────────────────────────────────────────────────┤
│ ShadowLensAgentConsumer.requestAnalysisWithHttp()              │
│   → calls HTTP precompile 0x0801                               │
│   → stores Analysis record with pending status                 │
│   → emits AnalysisRequested event                              │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Ritual Executor (TEE)                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Receives X API URLs in precompile input                      │
│ 2. Makes authenticated GET/POST to X API                        │
│ 3. Parses response → shadow ban risk, engagement, patterns      │
│ 4. Returns structured result or raw JSON                        │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Backend Listener / Script                                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Watch contract for AnalysisRequested events                  │
│ 2. Fetch result from spcCalls in transaction receipt            │
│ 3. Parse X API response (engagement, posting patterns, etc.)    │
│ 4. Call fulfillAnalysis() with structured fields                │
└─────────────────────────────────────────────────────────────────┘
```

## X API Analysis Fields

The contract stores and returns:

- **Shadow Ban Risk**: `RiskLevel.Low | Medium | High` (determined by X metrics)
- **Engagement Health**: Tweet velocity, Like/RT ratios, reply sentiment
- **Posting Pattern**: Tweet frequency, typical times, content type distribution
- **Content Risk**: Words/topics flagged by X (automated detection rules)
- **Suggested Fixes**: Actions to improve visibility (post more, fix language, etc.)

## Prerequisites

1. **Ritual Wallet & RPC**
   - Ritual Chain RPC: `https://rpc.ritualfoundation.org`
   - Funded account on Ritual Chain (1979)

2. **X API Credentials**
   - X API key and secret (Bearer token or OAuth)
   - Access to X API v2 endpoints (user lookup, user tweets, user metrics)

3. **Dependencies**
   ```bash
   npm install
   ```

## Setup

1. Copy `.env.example` to `.env` and fill in:
   ```
   RITUAL_RPC_URL=https://rpc.ritualfoundation.org
   RITUAL_PRIVATE_KEY=0x...
   SHADOWLENS_CONTRACT_ADDRESS=0x...
   X_API_BEARER_TOKEN=Bearer ey...
   X_API_KEY=...
   X_API_SECRET=...
   ```

2. Deploy `ShadowLensAgentConsumer` to Ritual Chain if not already done:
   ```bash
   # Use hardhat or other deployment method
   # Set SHADOWLENS_CONTRACT_ADDRESS in .env after deploy
   ```

## Usage

### Option A: Direct HTTP Precompile Call (On-Chain)

```typescript
import { submitHttpPrecompileRequest } from './shadowlens-http-precompile';

const handle = 'elonmusk';
const weeklyMonitor = true;

const txHash = await submitHttpPrecompileRequest(handle, weeklyMonitor);
console.log('TX submitted:', txHash);
```

### Option B: Backend Processing + Oracle Fulfillment

```typescript
import { analyzeXHandle, fulfillShadowLensAnalysis } from './example-workflow';

const handle = 'elonmusk';
const analysis = await analyzeXHandle(handle);

// analysis contains:
// {
//   riskLevel: 'Low' | 'Medium' | 'High',
//   engagementHealth: '...',
//   postingPattern: '...',
//   contentRisk: '...',
//   suggestedFixes: '...'
// }

await fulfillShadowLensAnalysis(requestId, analysis);
```

## Key Files

- **`shadowlens-http-precompile.ts`**: HTTPCallRequest encoding and precompile submission
- **`example-workflow.ts`**: End-to-end X API fetch → ShadowLens fulfillment
- **`.env.example`**: Configuration template

## HTTP Precompile Details

### Field Mappings

The HTTP precompile on Ritual Chain is at `0x0801`. Ritual-supported methods:

| Method | Use Case | Cost |
|--------|----------|------|
| GET | Fetch user metrics, tweets, engagement | ~200k gas |
| POST | None typically needed for read-only X analysis | ~300k gas |

### X API Endpoints Used

1. **`/2/users/by/username/{username}`** → User ID lookup
2. **`/2/users/{id}/tweets`** → Recent tweets + engagement metrics
3. **`/2/users/{id}`** → User metrics (followers, tweet count)
4. **Custom analysis endpoints** → Shadow ban detection, content risk scoring

### Response Parsing

The executor returns raw X API JSON. Backend listener:
- Parses engagement ratios
- Checks for shadow ban indicators (zero impressions, filtered replies)
- Scores content risk based on flagged topics
- Generates suggested fixes

## Testing

### Local Hardhat

```bash
npm run deploy:local
npm run test:shadowlens
```

### Ritual Testnet

```bash
npm run submit:testnet -- --handle elonmusk --monitor
```

## Notes

- Each HTTP precompile call is one async transaction per block (Ritual policy)
- X API credentials are encrypted in the precompile payload
- Response parsing happens on backend after transaction settles
- Weekly monitoring cadence stored on-chain via `scheduleWeeklyMonitor()`
