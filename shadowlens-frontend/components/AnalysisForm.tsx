'use client';

interface AnalysisFormProps {
  handle: string;
  setHandle: (handle: string) => void;
  weeklyMonitor: boolean;
  setWeeklyMonitor: (monitor: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  isConnected: boolean;
  error: string;
  success: string;
}

export default function AnalysisForm({
  handle,
  setHandle,
  weeklyMonitor,
  setWeeklyMonitor,
  isLoading,
  onSubmit,
  isConnected,
  error,
  success,
}: AnalysisFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-6 backdrop-blur">
        <h2 className="text-xl font-semibold text-white mb-6">Analyze Twitter Account</h2>

        {/* Handle Input */}
        <div className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-slate-300">
            Twitter Handle
          </label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-slate-800 text-slate-400 rounded-lg border border-slate-700">
              @
            </span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace('@', ''))}
              placeholder="username"
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-slate-500">
            Enter a Twitter username to analyze shadow ban risk
          </p>
        </div>

        {/* Weekly Monitor Toggle */}
        <div className="mb-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Weekly Monitoring</p>
              <p className="text-sm text-slate-400">
                {weeklyMonitor
                  ? 'Enabled - You will receive weekly status updates'
                  : 'Disabled - One-time analysis only'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWeeklyMonitor(!weeklyMonitor)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                weeklyMonitor ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  weeklyMonitor ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50">
            <p className="text-sm text-green-400">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isConnected || !handle.trim()}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
            isLoading || !isConnected || !handle.trim()
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-linear-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-white animate-spin" />
              Analyzing...
            </div>
          ) : !isConnected ? (
            'Connect Wallet to Analyze'
          ) : (
            'Analyze Account'
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-blue-500/10 border border-blue-500/50 p-4">
        <h3 className="font-semibold text-blue-400 mb-2">How it Works</h3>
        <ul className="space-y-2 text-sm text-blue-300">
          <li>• Enter a Twitter handle to scan for shadow ban indicators</li>
          <li>• Analysis checks engagement patterns and account health</li>
          <li>• Get recommendations to improve account visibility</li>
          <li>• Optional weekly monitoring tracks changes over time</li>
        </ul>
      </div>
    </form>
  );
}
