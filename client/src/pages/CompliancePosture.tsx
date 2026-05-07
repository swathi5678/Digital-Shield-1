import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { ComplianceControl } from '../types/security.types.js';
import DataTable from '../components/shared/DataTable.js';
import RiskScore from '../components/shared/RiskScore.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

export default function CompliancePosture() {
  const { user } = useSecurityStore();
  const [controls, setControls] = useState<ComplianceControl[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<string>('SOX');
  const [loading, setLoading] = useState(true);
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

    const fetchControls = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${project}/compliance?framework=${selectedFramework}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setControls(res.data);
      } catch (err) {
        console.error('Failed to fetch controls', err);
      } finally {
        setLoading(false);
      }
    };

    fetchControls();
  }, [user, selectedFramework]);

  const frameworks = ['SOX', 'GDPR', 'DPDP', 'SAP_BASELINE'];
  
  const statusCounts = {
    compliant: controls.filter(c => c.status === 'compliant').length,
    non_compliant: controls.filter(c => c.status === 'non_compliant').length,
    partial: controls.filter(c => c.status === 'partial').length,
    not_assessed: controls.filter(c => c.status === 'not_assessed').length
  };

  const complianceScore = controls.length > 0 ? Math.round(
    (statusCounts.compliant + statusCounts.partial * 0.5) / controls.length * 100
  ) : 0;

  const chartData = [
    { name: 'Compliant', value: statusCounts.compliant, color: '#22C55E' },
    { name: 'Partial', value: statusCounts.partial, color: '#EAB308' },
    { name: 'Non-Compliant', value: statusCounts.non_compliant, color: '#EF4444' },
    { name: 'Not Assessed', value: statusCounts.not_assessed, color: '#9CA3AF' }
  ].filter(c => c.value > 0);

  const statusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-900 text-green-200';
      case 'partial': return 'bg-yellow-900 text-yellow-200';
      case 'non_compliant': return 'bg-red-900 text-red-200';
      case 'not_assessed': return 'bg-gray-900 text-gray-200';
      default: return 'bg-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {frameworks.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFramework(f)}
            className={`px-4 py-2 rounded font-semibold transition-colors ${
              selectedFramework === f
                ? 'bg-shield-accent text-white'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">{selectedFramework} COMPLIANCE SCORE</h2>
          <RiskScore score={complianceScore} size="lg" />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Control Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData} dataKey="value" cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={60}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
        <DataTable<ComplianceControl>
          columns={[
            { header: 'Control ID', key: 'control_id', sortable: true },
            { header: 'Name', key: 'control_name' },
            { header: 'Status', key: 'status', render: (v) => <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${statusColor(v)}`}>{v.replace('_', ' ')}</span> },
            { header: 'Evidence', key: 'evidence', render: (v) => v ? '✓' : '—' },
            { header: 'Assignee', key: 'assigned_to' },
            { header: 'Last Assessed', key: 'last_assessed', render: (v) => v ? new Date(v).toLocaleDateString() : 'Never' }
          ]}
          data={controls}
          loading={loading}
          searchable
          searchKeys={['control_id', 'control_name']}
        />
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">AI Audit Evidence Pack</h3>
          <button
            onClick={() => analyze('audit_evidence', { framework: selectedFramework, controls })}
            disabled={aiLoading}
            className="px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
          >
            {aiLoading ? 'Generating...' : 'Generate Evidence'}
          </button>
        </div>
        <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
      </div>
    </div>
  );
}
