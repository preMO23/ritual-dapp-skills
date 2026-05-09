'use client';

import { useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import ShadowLensAnalyzer from '@/components/ShadowLensAnalyzer';

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-black">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-lg">◇</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">ShadowLens</h1>
              <p className="text-xs text-slate-400">X/Twitter Shadow Ban Detector</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <ShadowLensAnalyzer contractAddress="0x299E2A8a95e0e1e88812faF8dFE3d124e10203c5" />
      </main>
    </div>
  );
}
