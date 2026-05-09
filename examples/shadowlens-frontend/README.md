# ShadowLens Frontend

A Next.js dApp for analyzing X (Twitter) accounts for shadow ban risk, engagement health, and posting patterns using Ritual Chain.

## Features

- **Wallet Connection**: Connect with RainbowKit and wagmi
- **X Account Analysis**: Request analysis of X handles for shadow ban risk
- **Real-time Updates**: Poll for analysis completion using Ritual Chain
- **Weekly Monitoring**: Enable automated weekly analysis
- **Ritual Native**: Built for Ritual Chain (Chain ID: 1979)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_WC_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_SHADOWLENS_ADDRESS=your_deployed_contract_address
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Blockchain**: wagmi + viem for Ritual Chain interaction
- **Wallet**: RainbowKit for wallet connection
- **Styling**: Tailwind CSS
- **Contracts**: ShadowLensAgentConsumer.sol on Ritual Chain

## Contract Integration

The frontend interacts with the ShadowLens contract deployed on Ritual Chain:

- `requestAnalysisWithHttp()`: Initiates analysis with HTTP precompile
- `analyses()`: Reads analysis results
- `AnalysisRequested` & `AnalysisCompleted`: Event monitoring

## Environment Variables

- `NEXT_PUBLIC_WC_PROJECT_ID`: WalletConnect project ID for RainbowKit
- `NEXT_PUBLIC_SHADOWLENS_ADDRESS`: Deployed ShadowLens contract address

## Development

- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

## Deployment

Deploy to Vercel, Netlify, or any static hosting service. Make sure to configure the environment variables in your deployment platform.