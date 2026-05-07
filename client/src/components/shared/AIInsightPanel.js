import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
export default function AIInsightPanel({ result, loading, error, onRetry }) {
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
    return (_jsxs("div", { className: "space-y-2 p-4 bg-slate-900 rounded-lg border border-slate-700 mt-4", children: [loading && (_jsxs("div", { className: "flex items-center gap-2 text-shield-accent", children: [_jsx("div", { className: "animate-spin", children: "\u23F3" }), _jsx("span", { children: "Analyzing with o4-mini..." })] })), error && (_jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "text-red-400 text-sm", children: error }), onRetry && (_jsx("button", { onClick: onRetry, className: "text-xs px-3 py-1 bg-red-900 hover:bg-red-800 text-red-200 rounded transition-colors", children: "Retry" }))] })), result && (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-semibold text-gray-400", children: "AI ANALYSIS" }), _jsx("button", { onClick: handleCopy, className: "flex items-center gap-1 text-xs px-2 py-1 hover:bg-slate-800 rounded transition-colors", children: copied ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "Copied"] })) : (_jsxs(_Fragment, { children: [_jsx(Copy, { className: "w-3 h-3" }), "Copy"] })) })] }), _jsx("div", { className: "bg-slate-800 p-3 rounded font-mono text-xs leading-relaxed text-gray-300 whitespace-pre-wrap overflow-x-auto max-h-96 overflow-y-auto", children: result })] }))] }));
}
