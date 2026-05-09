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

const getRiskColor = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low':
      return 'bg-green-500/10 border-green-500/50 text-green-400';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400';
    case 'high':
      return 'bg-red-500/10 border-red-500/50 text-red-400';
    default:
      return 'bg-slate-500/10 border-slate-500/50 text-slate-400';
  }
};

const getRiskIcon = (level: string) => {
  switch (level.toLowerCase()) {
    case 'low':
      return '✓';
    case 'medium':
      return '⚠';
    case 'high':
      return '✕';
    default:
      return '?';
  }
};

export default function ResultsDisplay({
  result,
}: {
  result: AnalysisResult;
}) {
  const riskColorClass = getRiskColor(result.riskLevel);
  const riskIcon = getRiskIcon(result.riskLevel);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-6 backdrop-blur">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-white">@{result.handle}</h3>
            <p className="text-sm text-slate-400">
              Analysis completed at{' '}
              {new Date(result.timestamp).toLocaleTimeString()}
            </p>
          </div>
          {result.weeklyMonitor && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/50">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-sm font-medium text-purple-300">
                Weekly Monitoring
              </span>
            </div>
          )}
        </div>

        {/* Risk Level Badge */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${riskColorClass}`}>
          <span className="text-2xl">{riskIcon}</span>
          <div>
            <p className="text-xs font-medium opacity-75">Shadow Ban Risk</p>
            <p className="text-lg font-bold">{result.riskLevel}</p>
          </div>
        </div>
      </div>

      {/* Analysis Details */}
      <div className="grid grid-cols-1 gap-4">
        {/* Engagement Health */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Engagement Health
          </h4>
          <p className="text-white">{result.engagementHealth}</p>
        </div>

        {/* Posting Pattern */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Posting Pattern
          </h4>
          <p className="text-white">{result.postingPattern}</p>
        </div>

        {/* Content Risk */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Content Risk
          </h4>
          <p className="text-white">{result.contentRisk}</p>
        </div>

        {/* Suggested Fixes */}
        <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">
            Recommended Actions
          </h4>
          <p className="text-white">{result.suggestedFixes}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white hover:bg-slate-800 transition-colors font-medium">
          Share Report
        </button>
        <button className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium">
          Export Results
        </button>
      </div>
    </div>
  );
}
