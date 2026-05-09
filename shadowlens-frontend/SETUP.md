# ShadowLens Frontend Setup

## Quick Start

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Configuration

### Contract Address
The contract address is configured in `app/page.tsx`:
```
0x299E2A8a95e0e1e88812faF8dFE3d124e10203c5
```

### Ritual Chain RPC
Currently configured to use `https://rpc-testnet.ritual.net`

Update in `app/layout.tsx` if needed:
```typescript
const ritualChain = {
  id: 6860,
  name: "Ritual Testnet",
  rpcUrls: {
    default: { http: ["YOUR_RPC_ENDPOINT"] },
  },
  // ...
};
```

## Features

### Analyze Tab
- Enter a Twitter handle
- Toggle weekly monitoring
- Submit for shadow ban analysis
- View real-time results

### History Tab
- View past analyses (stored in localStorage)
- See risk levels and recommendations
- Track monitoring status

## Components

- **ShadowLensAnalyzer**: Main container component
- **AnalysisForm**: Input and submission interface
- **ResultsDisplay**: Results visualization
- **AnalysisHistory**: Past analysis tracking

## Dependencies

- `next@16.2.6` - React framework
- `react@19.2.4` - UI library
- `wagmi@3.6.11` - Ethereum interactions
- `@rainbow-me/rainbowkit@2.2.11` - Wallet connection
- `ethers@6.16.0` - Ethereum utilities
- `tailwindcss@4` - Styling

## Build for Production

```bash
npm run build
npm run start
```

## Development

The frontend is set up with:
- ESLint for code quality
- TypeScript for type safety
- Tailwind CSS for styling
- Hot reload on file changes

Edit components in `components/` or pages in `app/` and changes will reflect immediately.

## Integration

To integrate with actual AI agents:

1. Replace mock results in `ShadowLensAnalyzer.tsx`
2. Update `requestAnalysisWithAgent()` call with proper agent precompile input
3. Implement listener for `onSovereignAgentResult` callbacks
4. Connect to real HTTP API endpoints for data fetching

## Next Steps

- [ ] Deploy to Vercel
- [ ] Integrate with actual shadow ban detection APIs
- [ ] Setup backend for agent processing
- [ ] Add authentication/user profiles
- [ ] Implement payment/subscription model
