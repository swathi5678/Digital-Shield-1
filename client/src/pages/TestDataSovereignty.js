import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import DataTable from '../components/shared/DataTable.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
// HeatMap not available in this build of recharts — removed import
export default function TestDataSovereignty() {
    const { user } = useSecurityStore();
    const [findings, setFindings] = useState([]);
    const [loading, setLoading] = useState(true);
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchFindings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/projects/${project}/data-findings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFindings(res.data);
            }
            catch (err) {
                console.error('Failed to fetch findings', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchFindings();
    }, [user]);
    const handleMask = async (id) => {
        try {
            const project = localStorage.getItem('project_id') || user?.project_id;
            const token = localStorage.getItem('token');
            await axios.patch(`/api/projects/${project}/data-findings/${id}/mask`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFindings(findings.map(f => f.id === id ? { ...f, masked: true } : f));
        }
        catch (err) {
            console.error('Failed to mask data', err);
        }
    };
    const maskedCount = findings.filter(f => f.masked).length;
    const exposedRegulations = [...new Set(findings.map(f => f.regulation))];
    const regulationGrid = Object.entries(findings.reduce((acc, f) => {
        const key = `${f.regulation}_${f.pii_type}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {}));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Datasets" }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: [...new Set(findings.map(f => f.dataset_name))].length })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "PII Fields" }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: findings.length })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Masked" }), _jsx("p", { className: "text-3xl font-bold text-green-400", children: maskedCount })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Exposed Regulations" }), _jsx("p", { className: "text-3xl font-bold text-shield-critical", children: exposedRegulations.length })] })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Data Findings" }), _jsx(DataTable, { columns: [
                            { header: 'Dataset', key: 'dataset_name' },
                            { header: 'SAP Table', key: 'table_name', sortable: true },
                            { header: 'Field', key: 'field_name' },
                            { header: 'PII Type', key: 'pii_type', render: (v) => v.replace('_', ' ').toUpperCase() },
                            { header: 'Regulation', key: 'regulation' },
                            { header: 'Records', key: 'record_count', sortable: true },
                            { header: 'Masked', key: 'masked', render: (v) => v ? '✓' : '✗' },
                            { header: 'Action', key: 'id', render: (id, row) => (row.masked ? (_jsx("span", { className: "text-xs text-green-400", children: "Masked" })) : (_jsx("button", { onClick: () => handleMask(id), className: "text-xs px-2 py-1 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded", children: "Request Mask" }))) }
                        ], data: findings, loading: loading, searchable: true, searchKeys: ['dataset_name', 'table_name', 'field_name'] })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Regulation \u00D7 PII Type Heatmap" }), _jsx("div", { className: "grid gap-2", children: regulationGrid.slice(0, 12).map(([key, count]) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-xs text-gray-400 w-24", children: key }), _jsx("div", { className: "flex-1 h-8 bg-slate-800 rounded", style: {
                                        background: `linear-gradient(90deg, rgba(108, 59, 255, ${Math.min(count / 5, 1)}) 0%, rgba(15, 23, 42, 1) 100%)`
                                    }, children: _jsx("span", { className: "px-2 text-xs text-white", children: count }) })] }, key))) })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "AI Data Risk Summary" }), _jsx("button", { onClick: () => analyze('data_risk', findings), disabled: aiLoading, className: "px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Analyzing...' : 'Generate Summary' })] }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError })] })] }));
}
