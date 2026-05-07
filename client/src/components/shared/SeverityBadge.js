import { jsx as _jsx } from "react/jsx-runtime";
export default function SeverityBadge({ severity }) {
    const colorMap = {
        critical: { bg: 'bg-red-900', text: 'text-red-200' },
        high: { bg: 'bg-orange-900', text: 'text-orange-200' },
        medium: { bg: 'bg-yellow-900', text: 'text-yellow-200' },
        low: { bg: 'bg-green-900', text: 'text-green-200' },
        info: { bg: 'bg-blue-900', text: 'text-blue-200' }
    };
    const { bg, text } = colorMap[severity];
    return (_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`, children: severity.toUpperCase() }));
}
