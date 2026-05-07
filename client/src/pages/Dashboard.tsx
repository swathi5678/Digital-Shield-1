import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { AuthFinding, DashboardSummary } from '../types/security.types.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import RiskScore from '../components/shared/RiskScore.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, AlertTriangle, ShieldCheck, Lock } from 'lucide-react';

export default function Dashboard() {
  const { user, projectId } = useSecurityStore();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

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
        ].filter((f: any) => f.severity === 'critical').length;

        const highCount = [
          ...auth.data,
          ...code.data,
          ...alerts.data
        ].filter((f: any) => f.severity === 'high').length;

        const maskedCount = data.data.filter((d: any) => d.masked).length;

        setSummary({
          overall_risk_score: 72,
          compliance_score: 65,
          critical_count: criticalCount,
          high_count: highCount,
          open_alerts: alerts.data.filter((a: any) => a.status === 'open').length,
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
            ...auth.data.slice(0, 2).map((f: AuthFinding) => ({
              id: f.id,
              type: 'auth' as const,
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
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading dashboard...</div>;
  }

  if (!summary) {
    return <div className="text-center py-12 text-gray-400">Unable to load dashboard data</div>;
  }

  const chartData = Object.entries(summary.findings_by_module).map(([module, count]) => ({
    name: module,
    findings: count
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">OVERALL RISK SCORE</h2>
          <div className="flex justify-center">
            <RiskScore score={summary.overall_risk_score} size="lg" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">COMPLIANCE SCORE</h2>
          <div className="flex justify-center">
            <RiskScore score={summary.compliance_score} size="lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">CRITICAL</span>
            <Zap className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-red-400">{summary.critical_count}</p>
          <p className="text-xs text-gray-500 mt-1">Findings</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">HIGH SEVERITY</span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-orange-400">{summary.high_count}</p>
          <p className="text-xs text-gray-500 mt-1">Findings</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">OPEN ALERTS</span>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-yellow-400">{summary.open_alerts}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold">MASKED DATA</span>
            <Lock className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-green-400">{summary.masked_datasets}</p>
          <p className="text-xs text-gray-500 mt-1">Datasets</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Findings by Module</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            <Bar dataKey="findings" fill="#6C3BFF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI CISO Brief</h3>
          <button
            onClick={() => analyze('ciso_brief', summary)}
            disabled={aiLoading}
            className="px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
          >
            {aiLoading ? 'Analyzing...' : 'Generate Brief'}
          </button>
        </div>
        <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
        <div className="mt-4 flex items-center justify-between">
          <div>Security Handover Report: <span className="px-2 py-1 rounded bg-yellow-800 text-sm">{localStorage.getItem('vse_handover_status') || 'unknown'}</span></div>
          <button onClick={() => window.location.assign('/vulnerability-surface')} className="text-sm text-shield-accent">Open VSE</button>
        </div>
      </div>
    </div>
  );
}
