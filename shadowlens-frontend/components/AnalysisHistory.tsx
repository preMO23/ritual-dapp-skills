'use client';

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

const getRiskBadgeColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low':
      return 'bg-green-500/20 text-green-400';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'high':
      return 'bg-red-500/20 text-red-400';
    default:
      return 'bg-slate-500/20 text-slate-400';
  }
};

export default function AnalysisHistory({
  history,
}: {
  history: AnalysisResult[];
}) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-12 text-center">
        <p className="text-slate-400 text-lg">No analysis history yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Run an analysis to start tracking results
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {history.map((result) => (
        <div
          key={result.requestId}
          className="rounded-lg border border-slate-700 bg-slate-900/30 p-4 hover:bg-slate-900/50 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-white truncate">
                  @{result.handle}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getRiskBadgeColor(
                    result.riskLevel
                  )}`}
                >
                  {result.riskLevel}
                </span>
                {result.weeklyMonitor && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Monitor
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 truncate">
                {result.engagementHealth}
              </p>
            </div>

            <div className="text-right whitespace-nowrap">
              <p className="text-xs text-slate-500">
                {new Date(result.timestamp).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-600">
                {new Date(result.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Expandable Details */}
          <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Posting Pattern</p>
              <p className="text-sm text-slate-300">{result.postingPattern}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Content Risk</p>
              <p className="text-sm text-slate-300">{result.contentRisk}</p>
            </div>
          </div>

          {/* Request ID */}
          <div className="mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-600 font-mono truncate">
              ID: {result.requestId}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
