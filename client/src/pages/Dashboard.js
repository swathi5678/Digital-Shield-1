import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import RiskScore from '../components/shared/RiskScore.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, AlertTriangle, Lock } from 'lucide-react';
export default function Dashboard() {
    const { user, projectId } = useSecurityStore();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchSummary = async () => {
            try {
                const token = localStorage.getItem('token');
                const [auth, code, data, alerts, compliance] = await Promise.all([
                    axios.get(`/api/projects/${project}/auth-findings`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`/api/projects/${project}/code-findings`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`/api/projects/${project}/data-findings`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`/api/projects/${project}/behavioral-alerts`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`/api/projects/${project}/compliance`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                const [vseSummaryRes, handoverRes] = await Promise.all([
                    axios.get(`/api/projects/${project}/vse/summary`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null })),
                    axios.get(`/api/projects/${project}/vse/handover`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: null }))
                ]);
                const criticalCount = [
                    ...auth.data,
                    ...code.data,
                    ...alerts.data
                ].filter((f) => f.severity === 'critical').length;
                const highCount = [
                    ...auth.data,
                    ...code.data,
                    ...alerts.data
                ].filter((f) => f.severity === 'high').length;
                const maskedCount = data.data.filter((d) => d.masked).length;
                setSummary({
                    overall_risk_score: 72,
                    compliance_score: 65,
                    critical_count: criticalCount,
                    high_count: highCount,
                    open_alerts: alerts.data.filter((a) => a.status === 'open').length,
                    masked_datasets: maskedCount,
                    findings_by_module: {
                        'AIE': auth.data.length,
                        'SCG': code.data.length,
                        'TDSL': data.data.length,
                        'CPM': compliance.data.length,
                        'BAS': alerts.data.length,
                        'VSE': vseSummaryRes.data?.post_golive_findings_total ?? 0
                    },
                    recent_findings: [
                        ...auth.data.slice(0, 2).map((f) => ({
                            id: f.id,
                            type: 'auth',
                            title: f.role_name,
                            severity: f.severity,
                            timestamp: f.detected_at
                        }))
                    ]
                });
                // Attach handover status chip to DOM (simple state update)
                // For now we set a small element in localStorage so Sidebar or other UI can read it
                if (handoverRes.data && handoverRes.data.report_status) {
                    localStorage.setItem('vse_handover_status', handoverRes.data.report_status);
                }
            }
            catch (err) {
                console.error('Failed to fetch dashboard data', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, [user]);
    if (loading) {
        return _jsx("div", { className: "text-center py-12 text-gray-400", children: "Loading dashboard..." });
    }
    if (!summary) {
        return _jsx("div", { className: "text-center py-12 text-gray-400", children: "Unable to load dashboard data" });
    }
    const chartData = Object.entries(summary.findings_by_module).map(([module, count]) => ({
        name: module,
        findings: count
    }));
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-400 mb-4", children: "OVERALL RISK SCORE" }), _jsx("div", { className: "flex justify-center", children: _jsx(RiskScore, { score: summary.overall_risk_score, size: "lg" }) })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h2", { className: "text-sm font-semibold text-gray-400 mb-4", children: "COMPLIANCE SCORE" }), _jsx("div", { className: "flex justify-center", children: _jsx(RiskScore, { score: summary.compliance_score, size: "lg" }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-gray-400 font-semibold", children: "CRITICAL" }), _jsx(Zap, { className: "w-4 h-4 text-red-500" })] }), _jsx("p", { className: "text-3xl font-bold text-red-400", children: summary.critical_count }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Findings" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-gray-400 font-semibold", children: "HIGH SEVERITY" }), _jsx(AlertTriangle, { className: "w-4 h-4 text-orange-500" })] }), _jsx("p", { className: "text-3xl font-bold text-orange-400", children: summary.high_count }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Findings" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-gray-400 font-semibold", children: "OPEN ALERTS" }), _jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-500" })] }), _jsx("p", { className: "text-3xl font-bold text-yellow-400", children: summary.open_alerts }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Active" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs text-gray-400 font-semibold", children: "MASKED DATA" }), _jsx(Lock, { className: "w-4 h-4 text-green-500" })] }), _jsx("p", { className: "text-3xl font-bold text-green-400", children: summary.masked_datasets }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Datasets" })] })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Findings by Module" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#334155" }), _jsx(XAxis, { dataKey: "name", stroke: "#94a3b8" }), _jsx(YAxis, { stroke: "#94a3b8" }), _jsx(Tooltip, { contentStyle: { backgroundColor: '#1e293b', border: '1px solid #475569' } }), _jsx(Bar, { dataKey: "findings", fill: "#6C3BFF" })] }) })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: "AI CISO Brief" }), _jsx("button", { onClick: () => analyze('ciso_brief', summary), disabled: aiLoading, className: "px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Analyzing...' : 'Generate Brief' })] }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("div", { children: ["Security Handover Report: ", _jsx("span", { className: "px-2 py-1 rounded bg-yellow-800 text-sm", children: localStorage.getItem('vse_handover_status') || 'unknown' })] }), _jsx("button", { onClick: () => window.location.assign('/vulnerability-surface'), className: "text-sm text-shield-accent", children: "Open VSE" })] })] })] }));
}
