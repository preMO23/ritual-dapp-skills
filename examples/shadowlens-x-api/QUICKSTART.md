# ShadowLens Quick Start

Get ShadowLens running in 5 minutes.

## 🚀 Quick Start (5 min)

### 1. Clone & Setup (1 min)
```bash
cd ritual-dapp-skills

# Install Hardhat dependencies
npm install

# Set environment variables
export PRIVATE_KEY=your_deployer_private_key
export RITUAL_RPC_URL=https://rpc.ritualfoundation.org
```

### 2. Deploy Contract (2 min)
```bash
npx hardhat run scripts/deploy-shadowlens.ts --network ritual
```
✅ Save the displayed contract address

### 3. Authorize Oracle (1 min)
```bash
npx hardhat run scripts/setup-oracle.ts --network ritual
```

### 4. Start Frontend (1 min)
```bash
cd examples/shadowlens-frontend

# Frontend .env.local is auto-created by deploy script
# Just add your WalletConnect ID:
# NEXT_PUBLIC_WC_PROJECT_ID=your_wc_project_id

npm install
npm run dev
```

### 5. Start Backend (bonus)
```bash
cd examples/shadowlens-x-api

# Create .env
cat > .env << EOF
RITUAL_RPC_URL=https://rpc.ritualfoundation.org
RITUAL_CHAIN_ID=1979
SHADOWLENS_CONTRACT_ADDRESS=0x... # from deployment
ORACLE_PRIVATE_KEY=$PRIVATE_KEY
X_API_BEARER_TOKEN=your_x_token
EOF

npm install
npx ts-node listener.ts
```

## 📋 Complete Component Documentation

- **Deployment Details**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Integration Testing**: [TESTING.md](./TESTING.md)
- **Script Reference**: [../scripts/SHADOWLENS_SCRIPTS.md](../../scripts/SHADOWLENS_SCRIPTS.md)
- **Contract Code**: [ShadowLensAgentConsumer.sol](../../contracts/ShadowLensAgentConsumer.sol)
- **Frontend README**: [../shadowlens-frontend/README.md](../shadowlens-frontend/README.md)

## ✅ Verify Everything Works

### Frontend Test
```bash
# Terminal 1: Frontend running at http://localhost:3000
✅ Can connect wallet
✅ See analysis form
✅ No console errors
```

### Backend Test
```bash
# Terminal 2: Listener running
✅ See "Listening for AnalysisRequested events..."
```

### Contract Test
```bash
# Terminal 3: Run verification
npx hardhat run scripts/test-shadowlens.ts --network ritual
✅ All tests pass
```

## 🧪 Full Integration Test

**With all services running (frontend, backend, listener):**

1. **Frontend**: http://localhost:3000
2. **Connect wallet** (ensure Ritual Chain 1979)
3. **Enter handle**: "twitter"
4. **Click**: "Analyze Account"
5. **Sign transaction** in wallet
6. **Watch backend** log the analysis
7. **Frontend** displays results after 10-20 seconds

✅ **Success** if results appear!

## 🌐 Key Addresses

- **Ritual Chain ID**: 1979
- **Sovereign Agent**: 0x080C
- **HTTP Precompile**: 0x0801
- **AsyncDelivery**: 0x5A16214fF555848411544b005f7Ac063742f39F6

## 🎉 You're ready!

All components are now ready to deploy and test. See full documentation links above for detailed setup and troubleshooting.
