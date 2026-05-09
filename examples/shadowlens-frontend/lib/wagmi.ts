import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

const ritualChain = defineChain({
  id: 1979,
  name: 'Ritual',
  nativeCurrency: {
    decimals: 18,
    name: 'Ritual',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.ritualfoundation.org'],
      webSocket: ['wss://rpc.ritualfoundation.org/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ritual Explorer',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
  contracts: {
    multicall3: {
      address: '0x5577Ea679673Ec7508E9524100a188E7600202a3',
    },
  },
});

export const config = getDefaultConfig({
  appName: 'ShadowLens',
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || 'your-walletconnect-project-id',
  chains: [ritualChain],
  ssr: true,
});
