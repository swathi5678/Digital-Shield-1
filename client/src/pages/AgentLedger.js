import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import DataTable from '../components/shared/DataTable.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { Copy, Download } from 'lucide-react';
export default function AgentLedger() {
    const { user } = useSecurityStore();
    const [entries, setEntries] = useState([]);
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(null);
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchEntries = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/projects/${project}/agent-ledger`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEntries(res.data);
            }
            catch (err) {
                console.error('Failed to fetch ledger', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchEntries();
    }, [user]);
    const stats = {
        total: entries.length,
        highRisk: entries.filter(e => e.risk_level === 'high').length,
        blocked: entries.filter(e => e.outcome === 'blocked').length,
        activeAgents: [...new Set(entries.map(e => e.agent_name))].length
    };
    const handleCopy = (hash) => {
        navigator.clipboard.writeText(hash);
        setCopied(hash);
        setTimeout(() => setCopied(null), 2000);
    };
    const handleExport = async () => {
        try {
            const project = localStorage.getItem('project_id') || user?.project_id;
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/projects/${project}/agent-ledger/export`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const element = document.createElement('a');
            element.setAttribute('href', `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.data, null, 2))}`);
            element.setAttribute('download', `agent-ledger-${project}.json`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
        catch (err) {
            console.error('Failed to export ledger', err);
        }
    };
    const outcomeColor = (outcome) => {
        switch (outcome) {
            case 'success': return 'bg-green-900 text-green-200';
            case 'partial': return 'bg-yellow-900 text-yellow-200';
            case 'failed': return 'bg-red-900 text-red-200';
            case 'blocked': return 'bg-orange-900 text-orange-200';
            default: return 'bg-slate-800';
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Total Actions" }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: stats.total })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "High-Risk" }), _jsx("p", { className: "text-3xl font-bold text-shield-high", children: stats.highRisk })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Blocked" }), _jsx("p", { className: "text-3xl font-bold text-shield-critical", children: stats.blocked })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Active Agents" }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: stats.activeAgents })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "Agent Ledger" }), _jsxs("button", { onClick: handleExport, className: "flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm rounded transition-colors", children: [_jsx(Download, { className: "w-4 h-4" }), "Export"] })] }), _jsx(DataTable, { columns: [
                                        { header: 'Timestamp', key: 'executed_at', render: (v) => new Date(v).toLocaleString() },
                                        { header: 'Agent', key: 'agent_name' },
                                        { header: 'Action', key: 'action_type' },
                                        { header: 'Target', key: 'target_object' },
                                        { header: 'Outcome', key: 'outcome', render: (v) => _jsx("span", { className: `text-xs font-semibold px-2 py-1 rounded capitalize ${outcomeColor(v)}`, children: v }) },
                                        { header: 'Risk Level', key: 'risk_level', render: (v) => _jsx("span", { className: v === 'high' ? 'text-red-400' : v === 'medium' ? 'text-yellow-400' : 'text-green-400', children: v }) },
                                        { header: 'Hash', key: 'hash', render: (v) => _jsxs("span", { className: "font-mono text-xs", children: [v.substring(0, 12), "\u2026"] }) }
                                    ], data: entries, onRowClick: setSelectedEntry, loading: loading, searchable: true, searchKeys: ['agent_name', 'action_type', 'target_object'] })] }) }), selectedEntry && (_jsxs("div", { className: "bg-slate-900 border border-shield-accent rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Entry Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Timestamp" }), _jsx("p", { className: "text-sm", children: new Date(selectedEntry.executed_at).toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Agent" }), _jsx("p", { className: "font-semibold", children: selectedEntry.agent_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Summary" }), _jsx("p", { className: "text-sm", children: selectedEntry.action_summary })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Data Accessed" }), _jsx("pre", { className: "bg-slate-800 p-2 rounded text-xs overflow-x-auto max-h-24", children: selectedEntry.data_accessed ? JSON.stringify(JSON.parse(selectedEntry.data_accessed || '{}'), null, 2) : 'None' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Chain Hash" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("code", { className: "bg-slate-800 px-2 py-1 rounded text-xs flex-1 overflow-x-auto", children: selectedEntry.hash }), _jsx("button", { onClick: () => handleCopy(selectedEntry.hash), className: "p-1 hover:bg-slate-700 rounded transition-colors", children: _jsx(Copy, { className: "w-4 h-4" }) })] })] }), _jsx("button", { onClick: () => analyze('explain_agent_action', selectedEntry), disabled: aiLoading, className: "w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Analyzing...' : 'Explain Action' }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError })] })] }))] })] }));
}
