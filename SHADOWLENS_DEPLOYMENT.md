# ShadowLens - Complete Deployment Guide

**ShadowLens** is an on-chain Twitter/X shadow ban risk assessment dApp built on Ritual Chain.

## Deployment Status ✅

| Component | Address | Status |
|-----------|---------|--------|
| ShadowLensAgentConsumer | `0x299E2A8a95e0e1e88812faF8dFE3d124e10203c5` | ✅ Deployed |
| Frontend | http://localhost:3000 | Ready for Dev |
| Chain | Ritual Testnet (6860) | Connected |

## Quick Start

### 1. Frontend Setup

```bash
cd shadowlens-frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your wallet.

### 2. Contract Address Configuration

The frontend is pre-configured with the deployed contract address:
```
0x299E2A8a95e0e1e88812faF8dFE3d124e10203c5
```

Located in: `shadowlens-frontend/app/page.tsx` line 28

### 3. Analyze a Twitter Account

1. Connect wallet via RainbowKit
2. Enter a Twitter handle (e.g., "elonmusk")
3. Optionally enable weekly monitoring
4. Submit for analysis
5. View results including:
   - Risk Level (Low/Medium/High)
   - Engagement Health
   - Posting Pattern
   - Content Risk Assessment
   - Recommended Actions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 16 + Wagmi + RainbowKit)                 │
│ ├─ ShadowLensAnalyzer (Main Component)                     │
│ ├─ AnalysisForm (Handle Input)                             │
│ ├─ ResultsDisplay (Risk Assessment)                        │
│ └─ AnalysisHistory (Tracking)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Viem/Wagmi calls)
┌──────────────────────────────┴──────────────────────────────┐
│ Smart Contract Layer (Ritual Chain)                         │
│ ├─ ShadowLensAgentConsumer.sol (Main)                      │
│ ├─ HTTP Precompile (0x0801)                                │
│ ├─ Sovereign Agent Precompile (0x080C)                     │
│ └─ Async Delivery (0x5A16...)                              │
└──────────────────────────────┬──────────────────────────────┘
                               │ (HTTP requests)
┌──────────────────────────────┴──────────────────────────────┐
│ Data Sources                                                │
│ ├─ Shadow Ban Detection API                                │
│ ├─ X/Twitter Public Data                                   │
│ └─ Ritual AI Agents (Sovereign/LLM)                        │
└─────────────────────────────────────────────────────────────┘
```

## Contract Features

### Core Functions

#### Request Analysis
```solidity
function requestAnalysisWithHttp(
    bytes calldata httpInput,
    string calldata handle,
    bool weeklyMonitor
) external returns (bytes memory)
```

Submits a Twitter handle for shadow ban analysis via HTTP precompile.

#### Callback Handler
```solidity
function onSovereignAgentResult(
    bytes32 jobId,
    bytes calldata result
) external
```

Receives async results from Ritual AI agents.

#### Manual Fulfillment
```solidity
function fulfillAnalysis(
    bytes32 requestId,
    RiskLevel riskLevel,
    string calldata engagementHealth,
    string calldata postingPattern,
    string calldata contentRisk,
    string calldata suggestedFixes
) external onlyOracle
```

Oracle-backed fulfillment for analysis results.

### Data Structures

```solidity
enum RiskLevel {
    Unknown,
    Low,
    Medium,
    High
}

struct Analysis {
    bytes32 requestId;
    address requester;
    string handle;
    RiskLevel riskLevel;
    string engagementHealth;
    string postingPattern;
    string contentRisk;
    string suggestedFixes;
    bool weeklyMonitor;
    Status status;
    uint256 createdAt;
    uint256 updatedAt;
}
```

## Frontend Components

### ShadowLensAnalyzer
Main orchestration component that:
- Manages wallet connection state
- Handles contract interactions via Wagmi
- Stores analysis history in localStorage
- Manages UI state (loading, errors, success)

### AnalysisForm
Input form featuring:
- Twitter handle input with @ prefix
- Weekly monitoring toggle
- Error and success alerts
- Loading state management

### ResultsDisplay
Results visualization showing:
- Twitter handle and monitoring status
- Risk level badge with icon
- Engagement health details
- Posting pattern analysis
- Content risk assessment
- Recommended actions

### AnalysisHistory
History view displaying:
- Past analyses with timestamps
- Risk level badges
- Engagement summaries
- Monitoring status indicators
- Detailed expandable information

## Integration with Ritual Features

### HTTP Precompile (0x0801)
Used for fetching shadow ban data from external APIs:
```typescript
(bool ok, bytes memory output) = HTTP_PRECOMPILE.call(httpInput);
```

### Sovereign Agent Precompile (0x080C)
Available for AI-powered analysis:
```typescript
(bool ok, bytes memory output) = SOVEREIGN_AGENT.call(precompileInput);
```

### Async Delivery (0x5A16...)
Handles callback results:
```solidity
function onSovereignAgentResult(
    bytes32 jobId,
    bytes calldata result
) external
```

## Data Flow

### Synchronous (HTTP)
1. User enters Twitter handle
2. Frontend calls contract `requestAnalysisWithHttp()`
3. Contract calls HTTP precompile to fetch data
4. Result returned immediately
5. Frontend displays analysis
6. Result stored in localStorage

### Asynchronous (Sovereign Agent)
1. User enters Twitter handle
2. Frontend calls contract `requestAnalysisWithAgent()`
3. Contract submits to Sovereign Agent precompile
4. Agent processes off-chain
5. Result delivered via `onSovereignAgentResult()`
6. Frontend polls for completion
7. Display updated analysis

## Deployment on Production

### Update RPC Endpoints

For mainnet deployment, update `shadowlens-frontend/app/layout.tsx`:

```typescript
const ritualChain = {
  id: 1979,  // Mainnet ID
  name: "Ritual Mainnet",
  rpcUrls: {
    default: { http: ["https://rpc.ritualchain.io"] },
  },
};
```

### Deploy to Vercel

```bash
cd shadowlens-frontend
npm run build
vercel deploy
```

### Update Contract Address

Store in environment variables:
```
NEXT_PUBLIC_SHADOWLENS_ADDRESS=0x299E2A8a95e0e1e88812faF8dFE3d124e10203c5
```

## Testing

### Manual Testing Checklist
- [ ] Wallet connection works (RainbowKit)
- [ ] Can enter Twitter handles
- [ ] Weekly monitor toggle works
- [ ] Analysis submission succeeds
- [ ] Results display correctly
- [ ] History persists across refreshes
- [ ] Responsive design on mobile

### Contract Testing

See `scripts/test-shadowlens.ts` for integration tests:
```bash
npx hardhat run scripts/test-shadowlens.ts
```

## API Integration

### Shadow Ban Detection APIs

**ShadowBan.EU GraphQL:**
```graphql
query($input: ShadowbanUserInput!) {
  shadowban {
    user(input: $input) {
      username
      protected
      suspended
      suspended_reason
      shadowbanned
      under_review
      has_previously_violated
    }
  }
}
```

**X/Twitter API (if available):**
- User account status
- Engagement metrics
- Posting history
- Content moderation flags

## Security Considerations

1. **Oracle Authorization**: Only authorized oracles can fulfill analyses
   ```solidity
   modifier onlyOracle() {
       require(authorizedOracles[msg.sender], "Not authorized oracle");
       _;
   }
   ```

2. **Request Validation**: Prevent duplicate submissions within time windows

3. **Data Integrity**: Results signed/hashed to prevent tampering

4. **Rate Limiting**: Implement per-address request throttling

## Monitoring

### Events to Track

```solidity
event AnalysisRequested(
    bytes32 indexed requestId,
    address indexed requester,
    string handle,
    bool weeklyMonitor
);

event AnalysisCompleted(
    bytes32 indexed requestId,
    RiskLevel riskLevel,
    string engagementHealth,
    string postingPattern,
    string contentRisk,
    string suggestedFixes
);

event WeeklyMonitorScheduled(
    bytes32 indexed requestId,
    uint256 cadenceSeconds
);
```

Monitor these events to:
- Track usage patterns
- Identify problematic accounts
- Validate analysis quality
- Detect system issues

## Troubleshooting

### Wallet Connection Issues
- Ensure Ritual chain is added to wallet
- Check RPC endpoint availability
- Verify chain ID matches (6860)

### Failed Analyses
- Check API endpoint availability
- Verify Twitter handle exists
- Check contract allowances
- Review transaction logs

### Historical Data Missing
- Clear browser localStorage
- Check browser console for errors
- Ensure cookies are enabled

## Future Enhancements

- [ ] Multi-account batch analysis
- [ ] Advanced risk scoring algorithm
- [ ] Machine learning model integration
- [ ] Community voting on risk levels
- [ ] NFT badges for risk assessment
- [ ] Payment integration (fiat/crypto)
- [ ] Public leaderboard
- [ ] API for third-party integration
- [ ] Dashboard with analytics
- [ ] Webhook notifications

## Support

For issues or questions:
1. Check logs: `shadowlens-frontend/.next`
2. Review contract deployment: `scripts/deploy-shadowlens.ts`
3. Test contract directly: `scripts/test-shadowlens.ts`

## License

Same as parent repository (Ritual dApp Skills)
