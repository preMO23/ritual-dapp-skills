# ShadowLens Deployment Troubleshooting

## Current Issue

**Error**: `ProviderError: already known` when deploying to Ritual Chain
**Account**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
**Chain**: Ritual Chain (1979)
**Status**: Account nonce stuck at 215 in mempool

## What This Means

The "already known" error indicates that the Ritual Chain RPC has seen this transaction nonce (215) before and is rejecting new submissions with the same nonce. This typically happens when:
1. A previous transaction with this nonce was submitted but not mined
2. The mempool is rejecting retransmissions
3. The account needs a longer wait time before the mempool clears

## Solutions

### Option 1: Request Fresh Account/Testnet Funds
Contact Ritual team to get:
- A different private key with testnet RIT funds
- Or a testnet faucet to get new gas on a fresh account

### Option 2: Manual Deployment via Remix/Web Interface
Use Ritual Chain's web deployment tools directly if available

### Option 3: Use Existing Deployed Contract
If a contract was previously deployed at a known address, update:
- `.env.local` with `NEXT_PUBLIC_SHADOWLENS_ADDRESS=0x...previousAddress`

### Option 4: Wait and Retry (24 hours+)
The mempool may eventually clear the stuck nonce, allowing new transactions

## Current Setup Status

✅ **Completed:**
- Smart contract code: `contracts/ShadowLensAgentConsumer.sol` (206 lines, fully documented)
- Hardhat project setup in `examples/contract-listener/`
- Contract compilation: solc 0.8.24 compiles successfully
- Deployment scripts created: `scripts/deploy-shadowlens.cjs`
- Frontend template: `examples/shadowlens-frontend/` (Next.js + Wagmi + RainbowKit)
- Backend template: `examples/shadowlens-x-api/` (TypeScript listener)
- Placeholder .env.local created for frontend

❌ **Blocked:**
- Contract deployment to Ritual Chain (mempool nonce issue)
- Full end-to-end testing with deployed contract

## To Deploy When Account is Resolved

```bash
cd examples/contract-listener
npx hardhat run scripts/deploy-shadowlens.cjs --network ritual
```

This will:
1. Deploy ShadowLensAgentConsumer contract
2. Create `../shadowlens-frontend/.env.local` with contract address
3. Generate deployment.json with all deployment details

## To Test Locally (Alternative)

```bash
# Start local Hardhat node
npx hardhat node

# In another terminal, deploy to localhost
npx hardhat run scripts/deploy-shadowlens.cjs --network localhost

# Then run frontend and backend against localhost:8545
```

## Contract Details

**Address**: TBD (pending successful deployment)
**Deployer**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
**Solidity Version**: 0.8.24
**License**: MIT
**Key Features**:
- Ritual precompile integration (0x0801 HTTP, 0x080C Sovereign Agent)
- Oracle fulfillment pattern for X API analysis
- Weekly monitoring metadata support

## Files Ready for Deployment

1. Contract: `examples/contract-listener/contracts/ShadowLensAgentConsumer.sol`
2. Deploy Script: `examples/contract-listener/scripts/deploy-shadowlens.cjs`
3. Frontend: `examples/shadowlens-frontend/` (ready for `npm install`)
4. Backend: `examples/shadowlens-x-api/` (ready for `npm install`)

## Next Steps After Deployment

1. Update `NEXT_PUBLIC_SHADOWLENS_ADDRESS` in `.env.local`
2. Configure WalletConnect Project ID
3. Run frontend: `cd examples/shadowlens-frontend && npm install && npm run dev`
4. Run backend: `cd examples/shadowlens-x-api && npm install && npx ts-node listener.ts`
5. Test full workflow in browser at `http://localhost:3000`
