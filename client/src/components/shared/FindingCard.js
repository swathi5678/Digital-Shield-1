import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import SeverityBadge from './SeverityBadge.js';
import { ArrowRight } from 'lucide-react';
export default function FindingCard({ severity, title, description, status, timestamp, onViewDetails }) {
    const statusColor = {
        open: 'bg-blue-900 text-blue-200',
        in_review: 'bg-yellow-900 text-yellow-200',
        remediated: 'bg-green-900 text-green-200',
        accepted: 'bg-gray-900 text-gray-200',
        investigating: 'bg-orange-900 text-orange-200',
        cleared: 'bg-green-900 text-green-200',
        escalated: 'bg-red-900 text-red-200'
    }[status] || 'bg-gray-900 text-gray-200';
    return (_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors", children: [_jsxs("div", { className: "flex items-start justify-between mb-2", children: [_jsx(SeverityBadge, { severity: severity }), _jsx("span", { className: `text-xs font-semibold px-2 py-1 rounded ${statusColor}`, children: status.replace('_', ' ').toUpperCase() })] }), _jsx("h3", { className: "font-semibold text-white mb-2", children: title }), _jsx("p", { className: "text-sm text-gray-300 mb-3 line-clamp-2", children: description }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs text-gray-500", children: new Date(timestamp).toLocaleString() }), _jsxs("button", { onClick: onViewDetails, className: "flex items-center gap-1 text-xs text-shield-accent hover:text-purple-300 transition-colors", children: ["View details", _jsx(ArrowRight, { className: "w-3 h-3" })] })] })] }));
}
