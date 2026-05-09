'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseAbi, encodeFunctionData } from 'viem';
import AnalysisForm from './AnalysisForm';
import ResultsDisplay from './ResultsDisplay';
import AnalysisHistory from './AnalysisHistory';

const SHADOWLENS_ABI = parseAbi([
  'function requestAnalysisWithAgent(bytes calldata precompileInput, string calldata handle, bool weeklyMonitor) external returns (bytes memory)',
  'function requestAnalysisWithHttp(bytes calldata httpInput, string calldata handle, bool weeklyMonitor) external returns (bytes memory)',
  'function fulfillAnalysis(bytes32 requestId, uint8 riskLevel, string calldata engagementHealth, string calldata postingPattern, string calldata contentRisk, string calldata suggestedFixes) external',
  'function scheduleWeeklyMonitor(bytes32 requestId, uint256 cadenceSeconds) external',
  'event AnalysisRequested(bytes32 indexed requestId, address indexed requester, string handle, bool weeklyMonitor)',
  'event AnalysisCompleted(bytes32 indexed requestId, uint8 riskLevel, string engagementHealth, string postingPattern, string contentRisk, string suggestedFixes)',
]);

interface AnalysisResult {
  requestId: string;
  handle: string;
  riskLevel: string;
  engagementHealth: string;
  postingPattern: string;
  contentRisk: string;
  suggestedFixes: string;
  weeklyMonitor: boolean;
  timestamp: number;
}

export default function ShadowLensAnalyzer({
  contractAddress,
}: {
  contractAddress: `0x${string}`;
}) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [handle, setHandle] = useState('');
  const [weeklyMonitor, setWeeklyMonitor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('shadowlens-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem('shadowlens-history', JSON.stringify(history));
  }, [history]);

  const handleAnalyze = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isConnected || !address) {
        setError('Please connect your wallet first');
        return;
      }

      if (!handle.trim()) {
        setError('Please enter a Twitter handle');
        return;
      }

      if (!walletClient) {
        setError('Wallet client not available');
        return;
      }

      setIsLoading(true);
      setError('');
      setSuccess('');

      try {
        // Create HTTP request data for Shadow Ban API
        const apiEndpoint = 'https://shadowban.eu/.api/graphql';
        const graphQLQuery = {
          query: `query($input: ShadowbanUserInput!) {
            shadowban {
              user(input: $input) {
                  username
                  protected
                  suspended
                  suspended_reason
                  shadowbanned
                  under_review
                  has_previously_violated
                  is_live_streaming
                  has_bans_on_other_Twitter_accounts
              }
            }
          }`,
          variables: {
            input: {
              username: handle.replace('@', ''),
            },
          },
        };

        // For now, create a simple HTTP request
        const httpInput = JSON.stringify({
          method: 'POST',
          url: apiEndpoint,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(graphQLQuery),
        });

        // Call the contract with HTTP precompile
        const tx = await walletClient.writeContract({
          address: contractAddress,
          abi: SHADOWLENS_ABI,
          functionName: 'requestAnalysisWithHttp',
          args: [httpInput as `0x${string}`, handle, weeklyMonitor],
        });

        setSuccess(`Analysis requested! Transaction: ${tx}`);

        // Create a mock result for now (in production, this would come from the agent callback)
        const mockResult: AnalysisResult = {
          requestId: tx,
          handle,
          riskLevel: 'Low',
          engagementHealth: 'Healthy - Normal engagement patterns detected',
          postingPattern: 'Regular - Consistent posting schedule observed',
          contentRisk: 'Low - No suspicious content patterns detected',
          suggestedFixes: 'Continue with current activity patterns',
          weeklyMonitor,
          timestamp: Date.now(),
        };

        setCurrentResult(mockResult);
        setHistory([mockResult, ...history.slice(0, 4)]);
        setHandle('');
        setWeeklyMonitor(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to request analysis';
        setError(errorMessage);
        console.error('Analysis error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isConnected, address, handle, weeklyMonitor, walletClient, contractAddress, history]
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('analyze')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'analyze'
              ? 'border-b-2 border-purple-500 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          Analyze
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-purple-500 text-white'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          History ({history.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'analyze' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <AnalysisForm
            handle={handle}
            setHandle={setHandle}
            weeklyMonitor={weeklyMonitor}
            setWeeklyMonitor={setWeeklyMonitor}
            isLoading={isLoading}
            onSubmit={handleAnalyze}
            isConnected={isConnected}
            error={error}
            success={success}
          />

          {/* Results or Empty State */}
          {currentResult ? (
            <ResultsDisplay result={currentResult} />
          ) : (
            <div className="lg:col-span-1 rounded-lg border border-slate-700 bg-slate-900/30 p-6 text-center">
              <p className="text-slate-400">
                Submit a Twitter handle to see analysis results
              </p>
            </div>
          )}
        </div>
      ) : (
        <AnalysisHistory history={history} />
      )}
    </div>
  );
}
