import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
// HeatMapGrid not available in this build of recharts — removed import
export default function BehavioralSentinel() {
    const { user } = useSecurityStore();
    const [alerts, setAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [loading, setLoading] = useState(true);
    const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();
    useEffect(() => {
        const project = localStorage.getItem('project_id') || user?.project_id;
        if (!project)
            return;
        const fetchAlerts = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/projects/${project}/behavioral-alerts`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAlerts(res.data);
            }
            catch (err) {
                console.error('Failed to fetch alerts', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, [user]);
    const handleStatusChange = async (id, status) => {
        try {
            const project = localStorage.getItem('project_id') || user?.project_id;
            const token = localStorage.getItem('token');
            await axios.patch(`/api/projects/${project}/behavioral-alerts/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAlerts(alerts.map(a => a.id === id ? { ...a, status: status } : a));
        }
        catch (err) {
            console.error('Failed to update alert', err);
        }
    };
    const stats = {
        active: alerts.filter(a => a.status === 'open').length,
        highRisk: alerts.filter(a => a.risk_score >= 75).length,
        cleared: alerts.filter(a => a.status === 'cleared').length,
        maxRisk: Math.max(0, ...alerts.map(a => a.risk_score))
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Active Alerts" }), _jsx("p", { className: "text-3xl font-bold text-shield-critical", children: stats.active })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "High-Risk Users" }), _jsx("p", { className: "text-3xl font-bold text-shield-high", children: stats.highRisk })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Cleared Today" }), _jsx("p", { className: "text-3xl font-bold text-green-400", children: "4" })] }), _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-4", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold mb-2", children: "Max Risk Score" }), _jsx("p", { className: "text-3xl font-bold text-orange-400", children: stats.maxRisk })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2", children: _jsxs("div", { className: "bg-slate-900 border border-slate-700 rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Behavioral Alerts" }), _jsx(DataTable, { columns: [
                                        { header: 'User', key: 'user_name', sortable: true },
                                        { header: 'Alert Type', key: 'alert_type', render: (v) => v.replace('_', ' ').toUpperCase() },
                                        { header: 'Severity', key: 'severity', render: (v) => _jsx(SeverityBadge, { severity: v }) },
                                        { header: 'Risk Score', key: 'risk_score', render: (v) => _jsx("span", { className: v >= 75 ? 'text-red-400 font-bold' : v >= 50 ? 'text-orange-400' : 'text-green-400', children: v }) },
                                        { header: 'System', key: 'source_system' },
                                        { header: 'Time', key: 'occurred_at', render: (v) => new Date(v).toLocaleTimeString() },
                                        { header: 'Status', key: 'status', render: (v) => _jsx("span", { className: "text-xs bg-slate-800 px-2 py-1 rounded capitalize", children: v }) }
                                    ], data: alerts, onRowClick: setSelectedAlert, loading: loading, searchable: true, searchKeys: ['user_name', 'alert_type'] })] }) }), selectedAlert && (_jsxs("div", { className: "bg-slate-900 border border-shield-accent rounded-lg p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-4", children: "Alert Details" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "User" }), _jsx("p", { className: "font-semibold", children: selectedAlert.user_name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Activity" }), _jsx("p", { className: "text-sm", children: selectedAlert.activity })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-400 mb-1", children: "Details" }), _jsx("p", { className: "text-sm", children: selectedAlert.details })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs text-gray-400 font-semibold", children: "Status" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: ['investigating', 'cleared', 'escalated'].map(status => (_jsx("button", { onClick: () => handleStatusChange(selectedAlert.id, status), className: `px-2 py-1 text-xs rounded transition-colors ${selectedAlert.status === status
                                                        ? 'bg-shield-accent text-white'
                                                        : 'bg-slate-800 hover:bg-slate-700 text-gray-300'}`, children: status.replace('_', ' ') }, status))) })] }), _jsx("button", { onClick: () => analyze('behavioral_risk', selectedAlert), disabled: aiLoading, className: "w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors", children: aiLoading ? 'Analyzing...' : 'Investigate with AI' }), _jsx(AIInsightPanel, { result: result, loading: aiLoading, error: aiError })] })] }))] })] }));
}
