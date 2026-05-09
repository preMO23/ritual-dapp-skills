'use client';

import { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WagmiProvider, createConfig, http } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ritual Chain configuration
const ritualChain = {
  id: 6860,
  name: "Ritual Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.ritual.net"] },
  },
  blockExplorers: {
    default: { name: "Block Explorer", url: "https://explorer-testnet.ritual.net" },
  },
  testnet: true,
};

const wagmiConfig = createConfig({
  chains: [ritualChain as any],
  transports: {
    [ritualChain.id]: http("https://rpc-testnet.ritual.net"),
  },
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <title>ShadowLens - X/Twitter Shadow Ban Detector</title>
        <meta
          name="description"
          content="Assess shadow ban risk on X/Twitter using Ritual AI"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
