import { Severity } from '../../types/security.types.js';

interface SeverityBadgeProps {
  severity: Severity;
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorMap: Record<Severity, { bg: string; text: string }> = {
    critical: { bg: 'bg-red-900', text: 'text-red-200' },
    high: { bg: 'bg-orange-900', text: 'text-orange-200' },
    medium: { bg: 'bg-yellow-900', text: 'text-yellow-200' },
    low: { bg: 'bg-green-900', text: 'text-green-200' },
    info: { bg: 'bg-blue-900', text: 'text-blue-200' }
  };

  const { bg, text } = colorMap[severity];

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      {severity.toUpperCase()}
    </span>
  );
}
