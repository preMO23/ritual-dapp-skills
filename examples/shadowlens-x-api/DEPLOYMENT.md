# ShadowLens Deployment Guide

This guide walks through deploying the ShadowLens dApp to Ritual Chain.

## Prerequisites

- Node.js 18+ installed
- Ritual Chain testnet/mainnet RPC endpoint
- A funded Ethereum account for deployment
- Hardhat project configured

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Hardhat Network

Edit or create `hardhat.config.ts` with Ritual Chain configuration:

```typescript
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    ritual: {
      url: process.env.RITUAL_RPC_URL || "https://rpc.ritualfoundation.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1979,
    },
  },
};
```

### 3. Set Environment Variables

Create a `.env` file:

```bash
# Ritual Chain
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
PRIVATE_KEY=your_private_key_here

# WalletConnect (optional, for frontend)
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
```

## Deployment Steps

### Step 1: Deploy Contract

```bash
npx hardhat run scripts/deploy-shadowlens.ts --network ritual
```

Expected output:
```
🚀 Deploying ShadowLensAgentConsumer to Ritual Chain...

📝 Deploying with account: 0x...
🔗 Network: ritual (Chain ID: 1979)
💰 Account balance: X.XX ETH

✅ ShadowLensAgentConsumer deployed successfully!
📍 Contract Address: 0x...
```

This script will:
- Deploy the contract to Ritual Chain
- Save deployment info to `examples/shadowlens-frontend/deployment.json`
- Create `.env.local` in the frontend directory with the contract address

### Step 2: Authorize Oracle

The backend listener will need oracle permissions to fulfill analysis requests.

```bash
npx hardhat run scripts/setup-oracle.ts --network ritual
```

This authorizes the deployer's account to call `fulfillAnalysis()`.

### Step 3: Test Deployment

Verify the contract is working:

```bash
npx hardhat run scripts/test-shadowlens.ts --network ritual
```

Expected output shows contract state, authorization, and fulfillment capabilities.

## Frontend Configuration

After deployment, the frontend is automatically configured:

```bash
cd examples/shadowlens-frontend

# Install dependencies
npm install

# Add WalletConnect Project ID
# Edit .env.local and add your NEXT_PUBLIC_WC_PROJECT_ID

# Start dev server
npm run dev
```

The contract address is automatically included from the deployment.

## Backend Configuration

Update the backend listener to use the deployed contract:

```bash
cd examples/shadowlens-x-api

# Update listener.ts with:
# - SHADOWLENS_CONTRACT_ADDRESS: from deployment.json
# - CHAIN_ID: 1979
# - RPC_URL: https://rpc.ritualfoundation.org

npx ts-node listener.ts
```

## Full Integration Test

1. **Start Backend Listener**
   ```bash
   cd examples/shadowlens-x-api
   npx ts-node listener.ts
   ```

2. **Start Frontend**
   ```bash
   cd examples/shadowlens-frontend
   npm run dev
   ```
   Open http://localhost:3000

3. **Submit Analysis Request**
   - Connect wallet with RainbowKit
   - Enter X handle (e.g., "elonmusk")
   - Optionally enable weekly monitoring
   - Click "Analyze Account"

4. **Backend Listener**
   - Listens for AnalysisRequested events
   - Fetches X API metrics
   - Analyzes data
   - Calls `fulfillAnalysis()` with results

5. **Frontend Displays Results**
   - Polls contract for analysis completion
   - Displays risk level, engagement health, posting patterns
   - Shows suggested fixes

## Troubleshooting

### Insufficient Balance
```
Error: insufficient funds for gas
```
Solution: Fund your account with testnet ETH

### Network Mismatch
```
Error: wrong network
```
Solution: Ensure `--network ritual` flag is used and RPC URL is correct

### Oracle Not Authorized
```
Error: Not authorized oracle
```
Solution: Run `setup-oracle.ts` with the backend account

### Precompile Call Failed
```
Error: Sovereign agent call failed / HTTP precompile call failed
```
Solution: This is expected on local tests. Works on Ritual Chain with precompiles.

## Monitoring

Check deployment status:

```bash
# View deployment info
cat examples/shadowlens-frontend/deployment.json

# Check contract on explorer
# https://explorer.ritualfoundation.org/address/{CONTRACT_ADDRESS}
```

## Security Considerations

1. **Private Key Management**
   - Never commit `.env` to version control
   - Use environment variables or key management systems

2. **Oracle Authorization**
   - Only authorize trusted backend services
   - Consider implementing role-based access

3. **X API Credentials**
   - Store API tokens securely
   - Rotate periodically
   - Use restricted scopes

## Next Steps

- Implement additional analysis metrics
- Add database for historical analysis
- Create monitoring dashboard
- Deploy to production Ritual Chain

## Support

For issues or questions:
- Check Ritual documentation: https://docs.ritualfoundation.org
- Review contract ABI: `contracts/ShadowLensAgentConsumer.sol`
- Check backend logs for fulfillment errors
