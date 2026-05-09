# ShadowLens Integration & Testing Guide

Complete guide for testing and integrating all ShadowLens components.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  (RainbowKit wallet, analysis form, results display)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ wagmi/viem
                       │ Ritual Chain RPC
                       │
┌──────────────────────▼──────────────────────────────────────┐
│        ShadowLensAgentConsumer Smart Contract                │
│  (0x0801 HTTP Precompile, requestAnalysis, fulfill)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Events (AnalysisRequested)
                       │ Contract calls (fulfillAnalysis)
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            TypeScript Backend Listener                       │
│  (Ritual Chain event polling, X API calls, fulfillment)      │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- Node.js 18+
- npm or yarn
- 2+ GB free disk space
- Ritual Chain testnet/mainnet access

### Accounts & Keys
- Ethereum account with testnet ETH (for deployment)
- X API credentials (for X Account analysis)
- WalletConnect Project ID (for frontend)

### Services
- Ritual Chain RPC endpoint
- X API access
- Internet connection

## Phase 1: Contract Deployment

### 1.1 Setup Hardhat

```bash
cd ritual-dapp-skills

# Create hardhat.config.ts if needed
# Configure with Ritual Chain (1979)
```

### 1.2 Deploy Contract

```bash
# Set environment
export PRIVATE_KEY=your_deployer_private_key
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org

# Deploy
npx hardhat run scripts/deploy-shadowlens.ts --network ritual
```

**Expected Output:**
```
✅ ShadowLensAgentConsumer deployed successfully!
📍 Contract Address: 0x...
```

**Save this address** - you'll need it for frontend and backend.

### 1.3 Setup Oracle

The backend needs oracle permissions to fulfill requests:

```bash
npx hardhat run scripts/setup-oracle.ts --network ritual
```

**Verification:**
```bash
✅ Oracle authorized successfully!
```

### 1.4 Verify Deployment

```bash
npx hardhat run scripts/test-shadowlens.ts --network ritual
```

Should see all tests pass ✅

## Phase 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd examples/shadowlens-frontend
npm install
```

### 2.2 Configure Environment

The `.env.local` file should be created by deploy script. Verify it contains:

```bash
# .env.local
NEXT_PUBLIC_SHADOWLENS_ADDRESS=0x... # From deployment
NEXT_PUBLIC_WC_PROJECT_ID=your_wc_id # From WalletConnect
```

### 2.3 Start Development Server

```bash
npm run dev
```

**Expected output:**
```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

### 2.4 Test Frontend

1. Open http://localhost:3000
2. Click "Connect" and connect with MetaMask/RainbowKit
3. Verify wallet connection shows your address
4. Ensure you're on Ritual Chain (1979)

✅ Frontend is working if:
- Wallet connects successfully
- You see the analysis form
- No console errors

## Phase 3: Backend Listener Setup

### 3.1 Install Dependencies

```bash
cd examples/shadowlens-x-api
npm install
```

### 3.2 Configure Environment

Create `.env` in shadowlens-x-api:

```bash
# .env
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
RITUAL_CHAIN_ID=1979
SHADOWLENS_CONTRACT_ADDRESS=0x... # From deployment
ORACLE_PRIVATE_KEY=your_deployer_private_key

# X API
X_API_BEARER_TOKEN=your_x_bearer_token
X_API_BASE_URL=https://api.twitter.com/2

# Optional
LOG_LEVEL=debug
POLL_INTERVAL_MS=5000
```

### 3.3 Verify X API Credentials

```bash
npx ts-node -e "
import axios from 'axios';
const token = process.env.X_API_BEARER_TOKEN;
axios.get('https://api.twitter.com/2/users/by/username/twitter', {
  headers: { 'Authorization': \`Bearer \${token}\` }
}).then(() => console.log('✅ X API auth works'))
  .catch(err => console.error('❌ X API auth failed'));
"
```

### 3.4 Start Listener

```bash
npx ts-node listener.ts
```

**Expected output:**
```
🎧 ShadowLens Backend Listener Started
📍 Contract: 0x...
🔗 Chain: Ritual (1979)
📢 Listening for AnalysisRequested events...
```

## Phase 4: End-to-End Test

### 4.1 Prepare Test Environment

Have 3 terminals open:
1. **Terminal 1**: Frontend server
2. **Terminal 2**: Backend listener
3. **Terminal 3**: Contract interaction tests

### 4.2 Submit Analysis Request

**In Frontend (Terminal 1 view):**
1. Go to http://localhost:3000
2. Connect wallet
3. Enter X handle: "twitter"
4. Enable "Enable weekly monitoring" ✓
5. Click "Analyze Account"
6. Sign transaction in wallet

**Expected result:**
- Transaction submitted
- See pending status

### 4.3 Monitor Backend Processing

**In Backend (Terminal 2):**
Watch for logs like:

```
📨 New AnalysisRequested event
  - Request ID: 0x...
  - Handle: twitter
  - Requester: 0x...

🔍 Fetching X metrics for @twitter
📊 Analysis Results:
  - Risk Level: Low
  - Engagement Health: Strong

✅ Fulfilling analysis on-chain...
  - TX Hash: 0x...
  - Status: Confirmed
```

### 4.4 View Results in Frontend

**In Frontend:**
After 5-10 seconds, results should appear:

```
Shadow Ban Risk: Low ✓
Engagement Health: Strong
Posting Pattern: Consistent
Content Risk: Low
Suggested Fixes: None needed
```

## Phase 5: Test Various Scenarios

### Test 1: Basic Analysis
- Handle: "elonmusk"
- Weekly Monitor: OFF
- Expected: Quick analysis, no monitoring

### Test 2: Weekly Monitoring
- Handle: "satyadella"
- Weekly Monitor: ON
- Expected: Analysis + monitoring scheduled

### Test 3: Invalid Handle
- Handle: "nonexistent_handle_12345"
- Expected: X API returns no data, analysis shows Unknown risk

### Test 4: Multiple Concurrent Requests
- Submit 3 analysis requests rapidly
- Each should process independently
- Backend should handle concurrency

## Debugging

### Frontend Issues

**Issue: "Contract address not found"**
```typescript
// Check deployment.json exists
cat examples/shadowlens-frontend/deployment.json

// Or verify .env.local
cat examples/shadowlens-frontend/.env.local
```

**Issue: "Wallet not connecting"**
- Check WalletConnect Project ID is correct
- Verify you're on Ritual Chain (1979)
- Check browser console for errors

### Backend Issues

**Issue: "No events detected"**
```bash
# Verify contract address
echo $SHADOWLENS_CONTRACT_ADDRESS

# Check listener is actually running
# Should see "Listening for AnalysisRequested events..."
```

**Issue: "X API 401 Unauthorized"**
```bash
# Verify bearer token
echo $X_API_BEARER_TOKEN

# Test X API directly
curl -H "Authorization: Bearer $X_API_BEARER_TOKEN" \
  "https://api.twitter.com/2/users/by/username/twitter"
```

**Issue: "Fulfillment fails with 'Not authorized oracle'"**
```bash
# Run setup-oracle.ts again
npx hardhat run scripts/setup-oracle.ts --network ritual

# Verify oracle is authorized
npx hardhat run -e "
const ShadowLens = require('./artifacts/contracts/ShadowLensAgentConsumer.sol/ShadowLensAgentConsumer.json');
const contract = new ethers.Contract(contractAddress, ShadowLens.abi, provider);
const isAuthorized = await contract.authorizedOracles(oracleAddress);
console.log('Oracle authorized:', isAuthorized);
"
```

## Performance Metrics

### Expected Response Times
- Frontend submission: < 5 seconds (wallet approval)
- Backend X API call: 1-3 seconds
- Contract fulfillment: 2-10 seconds (block time)
- Total E2E: 10-30 seconds

### Gas Costs
- Deploy: ~500k gas
- Request: ~200k gas
- Fulfill: ~300k gas
- Total per analysis: ~0.5-1M gas

## Monitoring & Logging

### Enable Debug Logging

**Backend:**
```bash
LOG_LEVEL=debug npx ts-node listener.ts
```

**Frontend:**
```typescript
// In page.tsx
console.log('Analysis data:', analysisData);
console.log('Transaction hash:', hash);
```

### Check Contract Events

```bash
# Using Ritual Explorer
# https://explorer.ritualfoundation.org/address/{CONTRACT_ADDRESS}?tab=events
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No space left on device" | Disk full | Free up disk space |
| Network mismatch | Using wrong chain | Connect to Ritual (1979) |
| Oracle not authorized | Setup script not run | Run `setup-oracle.ts` |
| X API 401 | Invalid token | Update X_API_BEARER_TOKEN |
| Transaction fails | Insufficient gas | Check account balance |
| Events not detected | Listener not running | Check terminal 2 is active |
| Precompile failed | Local testing | Expected - works on Ritual |

## Next Steps After Successful Test

1. **Deploy to Production**
   - Use Ritual mainnet
   - Update RPC endpoints
   - Secure private keys

2. **Scale Backend**
   - Run multiple listener instances
   - Add database for analysis history
   - Implement caching

3. **Enhance Frontend**
   - Add analysis history
   - Implement notifications
   - Add detailed reports

4. **Monitor & Maintain**
   - Set up alerting
   - Monitor gas costs
   - Track X API quotas

## Support & Documentation

- Ritual Docs: https://docs.ritualfoundation.org
- X API Docs: https://developer.twitter.com/en/docs/twitter-api
- Smart Contract: `contracts/ShadowLensAgentConsumer.sol`
- Deployment: `examples/shadowlens-x-api/DEPLOYMENT.md`
