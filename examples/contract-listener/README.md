# Contract Listener Example

This example demonstrates an off-chain listener for the `ShadowLensProtocol` contract. It listens for `AnalysisRequested` events and fulfills them with AI-generated analysis (currently placeholder random logic).
> Note: A more Ritual-native architecture is available in `contracts/ShadowLensAgentConsumer.sol`. It now supports Ritual `0x0801` HTTP/X API workflows, X profile analysis metadata, and weekly monitoring event hooks.
## Prerequisites

- Node.js installed
- Access to a funded wallet on the target blockchain

## Local Testing Setup

For testing locally with Hardhat:

1. Install dependencies (including Hardhat):

   ```bash
   npm install
   ```

2. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

3. Deploy the contract locally and start the listener:

   ```bash
   npm run test-local
   ```

   This will deploy the contract to a local Hardhat network and start the listener.

4. In another terminal, trigger an analysis request:
   ```bash
   npx hardhat run scripts/test-request.js --network hardhat
   ```

## Production Setup

For production on Ritual Chain:

1. Install dependencies:

   ```bash
   npm install
   ```

2. **Create a `.env` file** by copying `.env.example` and filling in your values:

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your actual values:

   ```
   RPC_URL=https://rpc.ritualfoundation.org
   CONTRACT_ADDRESS=0xYourDeployedContractAddress
   PRIVATE_KEY=0xYourPrivateKey
   ```

3. Run the listener:
   ```bash
   npm start
   ```

## How it works

- The script connects to the blockchain via the RPC URL
- It listens for `AnalysisRequested` events on the contract
- When an event is detected, it performs AI analysis (placeholder: random score)
- It then calls `fulfillAnalysis` on the contract to update the on-chain state

## Integration with Ritual Agents

This pattern can be combined with Ritual's agent precompiles for more sophisticated AI analysis. Instead of random logic, you could use a Sovereign Agent (`0x080C`) or Persistent Agent (`0x0820`) to perform the analysis.
