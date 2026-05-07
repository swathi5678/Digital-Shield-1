import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { PieChart, Pie, BarChart, Bar, Cell, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
export default function SecureCodeGuardian() {
    const { user } = useSecurityStore();
    const [findings, setFindings] = useState([]);
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [loading, setLoading] = useState(true);
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchFindings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/projects/${project}/code-findings`, {
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
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const avgCVSS = findings.reduce((sum, f) => sum + (f.cvss_score || 0), 0) / findings.length || 0;
    const findingTypeData = Object.entries(findings.reduce((acc, f) => {
        acc[f.finding_type] = (acc[f.finding_type] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
    const objectTypeData = Object.entries(findings.reduce((acc, f) => {
        acc[f.object_type] = (acc[f.object_type] || 0) + 1;
        return acc;
    }, {})).map(([name, value]) => ({ name, value }));
    const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Objects Scanned" }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: findings.length })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Critical" }), _jsx("p", { className: "text-3xl font-bold text-shield-critical", children: criticalCount })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "High" }), _jsx("p", { className: "text-3xl font-bold text-shield-high", children: highCount })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "CVSS Average" }), _jsx("p", { className: "text-3xl font-bold text-yellow-400", children: avgCVSS.toFixed(1) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Code Findings" }), _jsx(DataTable, { columns: [
                                        { header: 'Object', key: 'object_name', sortable: true },
                                        { header: 'Type', key: 'object_type' },
                                        { header: 'Vulnerability', key: 'finding_type', render: (v) => v.replace('_', ' ') },
                                        { header: 'Line #', key: 'line_number' },
                                        { header: 'CVSS', key: 'cvss_score', render: (v) => v?.toFixed(1) || 'N/A' },
                                        { header: 'Severity', key: 'severity', render: (v) => _jsx(SeverityBadge, { severity: v }) }
                                    ], data: findings, onRowClick: setSelectedFinding, loading: loading, searchable: true, searchKeys: ['object_name', 'finding_type'] })] }) }), selectedFinding && (_jsxs("div", { className: "bg-slate-900 border border-shield-accent rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Finding Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Object" }), _jsx("p", { className: "font-mono text-sm", children: selectedFinding.object_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Code Snippet" }), _jsx("pre", { className: "bg-slate-800 p-2 rounded text-xs overflow-x-auto", children: selectedFinding.code_snippet })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Description" }), _jsx("p", { className: "text-sm", children: selectedFinding.description })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Remediation" }), _jsx("p", { className: "text-sm", children: selectedFinding.remediation })] }), _jsx("button", { onClick: () => analyze('code_fix', selectedFinding), disabled: aiLoading, className: "w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Generating...' : 'AI Fix Suggestion' }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError })] })] }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "By Vulnerability Type" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: findingTypeData, dataKey: "value", cx: "50%", cy: "50%", labelLine: false, label: ({ name, value }) => `${name}: ${value}`, outerRadius: 80, children: findingTypeData.map((_, index) => (_jsx(Cell, { fill: colors[index % colors.length] }, index))) }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#1e293b', border: '1px solid #475569' } })] }) })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "By Object Type" }), _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: objectTypeData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { dataKey: "name", stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#1e293b', border: '1px solid #475569' } }), _jsx(Bar, { dataKey: "value", fill: "#6C3BFF" })] }) })] })] })] }));
}
