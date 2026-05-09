'use client';

import React, { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { SHADOWLENS_ABI, SHADOWLENS_ADDRESS, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS, type Analysis } from '../lib/contracts';
import { encodeHttpCallRequest } from '../lib/http-precompile';

export default function Home() {
  const { address, isConnected } = useAccount();
  const [handle, setHandle] = useState('');
  const [weeklyMonitor, setWeeklyMonitor] = useState(false);
  const [requestId, setRequestId] = useState<`0x${string}` | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Mock HTTP precompile encoding for demo
  const buildHttpRequest = (xHandle: string) => {
    // This would normally encode a proper HTTPCallRequest for X API
    // For demo purposes, we'll use a placeholder
    return encodeHttpCallRequest({
      url: `https://api.twitter.com/2/users/by/username/${xHandle}?user.fields=public_metrics,created_at,verified,protected`,
      method: 0, // GET
      headers: ['Authorization: Bearer YOUR_TOKEN_HERE'],
      body: '',
      executor: '0x1234567890123456789012345678901234567890', // Mock executor
      timeout: 30,
    });
  };

  const { writeContract, data: hash, isPending } = useWriteContract();

  const { data: analysisData } = useReadContract({
    address: SHADOWLENS_ADDRESS,
    abi: SHADOWLENS_ABI,
    functionName: 'analyses',
    args: requestId ? [requestId] : undefined,
    query: {
      enabled: !!requestId,
      refetchInterval: 5000, // Poll every 5 seconds
    },
  });

  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Update analysis when contract data changes
  React.useEffect(() => {
    if (analysisData) {
      const [
        requestId,
        requester,
        handle,
        riskLevel,
        engagementHealth,
        postingPattern,
        contentRisk,
        suggestedFixes,
        weeklyMonitor,
        status,
        createdAt,
        updatedAt,
      ] = analysisData as any;

      setAnalysis({
        requestId,
        requester,
        handle,
        riskLevel: riskLevel as 0 | 1 | 2 | 3,
        engagementHealth,
        postingPattern,
        contentRisk,
        suggestedFixes,
        weeklyMonitor,
        status: status as 0 | 1,
        createdAt,
        updatedAt,
      });
    }
  }, [analysisData]);

  const submitAnalysis = () => {
    if (!handle.trim()) return;

    const httpInput = buildHttpRequest(handle);

    writeContract({
      address: SHADOWLENS_ADDRESS,
      abi: SHADOWLENS_ABI,
      functionName: 'requestAnalysisWithHttp',
      args: [httpInput, handle, weeklyMonitor],
    });

    // Generate a mock requestId for demo (in reality this would come from the tx)
    const mockRequestId = `0x${Math.random().toString(16).substring(2, 66)}` as `0x${string}`;
    setRequestId(mockRequestId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ShadowLens</h1>
          <p className="text-lg text-gray-600">Analyze X accounts for shadow ban risk and engagement health</p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center mb-8">
          <ConnectButton />
        </div>

        {isConnected && (
          <div className="max-w-2xl mx-auto">
            {/* Analysis Form */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">Request Analysis</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    X Handle (without @)
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="elonmusk"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="weeklyMonitor"
                    checked={weeklyMonitor}
                    onChange={(e) => setWeeklyMonitor(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="weeklyMonitor" className="ml-2 text-sm text-gray-700">
                    Enable weekly monitoring
                  </label>
                </div>

                <button
                  onClick={submitAnalysis}
                  disabled={isPending || !handle.trim()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Submitting...' : 'Analyze Account'}
                </button>
              </div>
            </div>

            {/* Transaction Status */}
            {hash && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h3 className="text-lg font-semibold mb-2">Transaction Status</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Hash: <code className="bg-gray-100 px-2 py-1 rounded">{hash}</code>
                  </p>
                  <p className="text-sm">
                    Status: {txConfirmed ? (
                      <span className="text-green-600 font-medium">Confirmed ✓</span>
                    ) : (
                      <span className="text-yellow-600">Pending...</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Analysis Results */}
            {analysis && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk Level */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Shadow Ban Risk</h4>
                    <div className={`text-2xl font-bold ${RISK_LEVEL_COLORS[analysis.riskLevel]}`}>
                      {RISK_LEVEL_LABELS[analysis.riskLevel]}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className={`text-lg font-medium ${analysis.status === 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                      {analysis.status === 1 ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Engagement Health</h4>
                    <p className="text-gray-700">{analysis.engagementHealth}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Posting Pattern</h4>
                    <p className="text-gray-700">{analysis.postingPattern}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Content Risk</h4>
                    <p className="text-gray-700">{analysis.contentRisk}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Suggested Fixes</h4>
                    <p className="text-gray-700">{analysis.suggestedFixes}</p>
                  </div>

                  {analysis.weeklyMonitor && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-800 text-sm">
                        📅 Weekly monitoring enabled for this account
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
