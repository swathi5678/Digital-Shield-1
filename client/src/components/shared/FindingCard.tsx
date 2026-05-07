import { Severity } from '../../types/security.types.js';
import SeverityBadge from './SeverityBadge.js';
import { ArrowRight } from 'lucide-react';

interface FindingCardProps {
  severity: Severity;
  title: string;
  description: string;
  status: string;
  timestamp: string;
  onViewDetails: () => void;
}

export default function FindingCard({
  severity,
  title,
  description,
  status,
  timestamp,
  onViewDetails
}: FindingCardProps) {
  const statusColor = {
    open: 'bg-blue-900 text-blue-200',
    in_review: 'bg-yellow-900 text-yellow-200',
    remediated: 'bg-green-900 text-green-200',
    accepted: 'bg-gray-900 text-gray-200',
    investigating: 'bg-orange-900 text-orange-200',
    cleared: 'bg-green-900 text-green-200',
    escalated: 'bg-red-900 text-red-200'
  }[status] || 'bg-gray-900 text-gray-200';

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <SeverityBadge severity={severity} />
        <span className={`text-xs font-semibold px-2 py-1 rounded ${statusColor}`}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-300 mb-3 line-clamp-2">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{new Date(timestamp).toLocaleString()}</span>
        <button
          onClick={onViewDetails}
          className="flex items-center gap-1 text-xs text-shield-accent hover:text-purple-300 transition-colors"
        >
          View details
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
