import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import SoDUploadComponent from '../components/modules/SoDUploadComponent.js';
import SoDResultsComponent from '../components/modules/SoDResultsComponent.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
export default function AuthorizationIntelligence() {
    const { user } = useSecurityStore();
    const [findings, setFindings] = useState([]);
    const [selectedFinding, setSelectedFinding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sodResults, setSodResults] = useState(null);
    const [activeTab, setActiveTab] = useState('sod');
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchFindings = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/projects/${project}/auth-findings`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFindings(res.data);
                localStorage.setItem('project_id', project);
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
    const statsData = [
        { label: 'Roles Scanned', value: 42 },
        { label: 'SoD Violations', value: findings.filter(f => f.finding_type === 'sod_violation').length },
        { label: 'Privileged Users', value: findings.filter(f => f.finding_type === 'privileged_access').length },
        { label: 'Orphaned Roles', value: findings.filter(f => f.finding_type === 'orphaned_role').length }
    ];
    const scatterData = findings.map((f, i) => ({
        x: (i % 10) * 10,
        y: ['critical', 'high', 'medium', 'low'].indexOf(f.severity) * 25 + 25,
        name: f.role_name,
        fill: f.severity === 'critical' ? '#EF4444' : f.severity === 'high' ? '#F97316' : f.severity === 'medium' ? '#EAB308' : '#22C55E'
    }));
    const projectId = localStorage.getItem('project_id') || user?.project_id || '';
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex gap-2 border-b border-slate-700", children: [_jsx("button", { onClick: () => setActiveTab('sod'), className: `px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'sod'
                            ? 'border-shield-accent text-shield-accent'
                            : 'border-transparent text-gray-400 hover:text-white'}`, children: "SoD Detection (NEW)" }), _jsx("button", { onClick: () => setActiveTab('traditional'), className: `px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'traditional'
                            ? 'border-shield-accent text-shield-accent'
                            : 'border-transparent text-gray-400 hover:text-white'}`, children: "Traditional Findings" })] }), activeTab === 'sod' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-start gap-3", children: [_jsx("svg", { className: "w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z", clipRule: "evenodd" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-blue-200 mb-1", children: "Product-Market Fit Ready" }), _jsx("p", { className: "text-sm text-blue-300", children: "Upload your AGR_USERS and AGR_1251 CSVs from SAP. The detection engine will identify segregation of duties violations across roles and user assignments - violations that competitors miss during mid-migration projects." })] })] }), _jsx(SoDUploadComponent, { projectId: projectId, onDetectionComplete: (results) => {
                            setSodResults(results);
                            setActiveTab('sod');
                        } }), sodResults && _jsx(SoDResultsComponent, { projectId: projectId, results: sodResults })] })), activeTab === 'traditional' && (_jsxs(_Fragment, { children: [_jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: statsData.map((stat) => (_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: stat.label }), _jsx("p", { className: "text-3xl font-bold text-shield-accent", children: stat.value })] }, stat.label))) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Authorization Findings" }), _jsx(DataTable, { columns: [
                                                { header: 'Role', key: 'role_name', sortable: true },
                                                { header: 'Type', key: 'finding_type', render: (v) => v.replace('_', ' ').toUpperCase() },
                                                { header: 'T-Code Conflict', key: 'tcode_1', render: (v, row) => row.tcode_2 ? `${v} / ${row.tcode_2}` : v },
                                                { header: 'Severity', key: 'severity', render: (v) => _jsx(SeverityBadge, { severity: v }) },
                                                { header: 'Users', key: 'user_count', sortable: true },
                                                { header: 'Status', key: 'status', render: (v) => _jsx("span", { className: "text-xs bg-slate-800 px-2 py-1 rounded capitalize", children: v }) }
                                            ], data: findings, onRowClick: setSelectedFinding, loading: loading, searchable: true, searchKeys: ['role_name', 'tcode_1', 'tcode_2'] })] }) }), selectedFinding && (_jsxs("div", { className: "bg-slate-900 border border-shield-accent rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Finding Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Role" }), _jsx("p", { className: "font-mono text-sm", children: selectedFinding.role_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Type" }), _jsx("p", { className: "text-sm capitalize", children: selectedFinding.finding_type.replace('_', ' ') })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "T-Code Conflict" }), _jsxs("p", { className: "text-sm", children: [selectedFinding.tcode_1, " + ", selectedFinding.tcode_2] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Description" }), _jsx("p", { className: "text-sm", children: selectedFinding.description })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Remediation" }), _jsx("p", { className: "text-sm", children: selectedFinding.remediation })] }), _jsx("button", { onClick: () => analyze('remediation_plan', selectedFinding), disabled: aiLoading, className: "w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Generating...' : 'AI Remediation Plan' }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError })] })] }))] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Likelihood vs Impact" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(ScatterChart, { margin: { top: 20, right: 20, bottom: 20, left: 20 }, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { type: "number", dataKey: "x", name: "Likelihood", stroke: "#94a3b8" }), _jsx(YAxis, { type: "number", dataKey: "y", name: "Impact", stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#1e293b', border: '1px solid #475569' }, cursor: { strokeDasharray: '3 3' } }), _jsx(Scatter, { name: "Findings", data: scatterData, fill: "#6C3BFF" })] }) })] })] }))] }));
}
