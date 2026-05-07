import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AIInsightPanelProps {
  result: string | null;
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export default function AIInsightPanel({ result, loading, error, onRetry }: AIInsightPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!result && !loading && !error) {
    return null;
  }

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2 p-4 bg-slate-900 rounded-lg border border-slate-700 mt-4">
      {loading && (
        <div className="flex items-center gap-2 text-shield-accent">
          <div className="animate-spin">⏳</div>
          <span>Analyzing with o4-mini...</span>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <div className="text-red-400 text-sm">{error}</div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs px-3 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-400">AI ANALYSIS</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs px-2 py-1 hover:bg-slate-800 rounded transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="bg-slate-800 p-3 rounded font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
