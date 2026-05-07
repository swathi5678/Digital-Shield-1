import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { BehavioralAlert } from '../types/security.types.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
// HeatMapGrid not available in this build of recharts — removed import

export default function BehavioralSentinel() {
  const { user } = useSecurityStore();
  const [alerts, setAlerts] = useState<BehavioralAlert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<BehavioralAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${project}/behavioral-alerts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlerts(res.data);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const project = localStorage.getItem('project_id') || user?.project_id;
      const token = localStorage.getItem('token');
      await axios.patch(`/api/projects/${project}/behavioral-alerts/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: status as any } : a));
    } catch (err) {
      console.error('Failed to update alert', err);
    }
  };

  const stats = {
    active: alerts.filter(a => a.status === 'open').length,
    highRisk: alerts.filter(a => a.risk_score >= 75).length,
    cleared: alerts.filter(a => a.status === 'cleared').length,
    maxRisk: Math.max(0, ...alerts.map(a => a.risk_score))
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Active Alerts</p>
          <p className="text-3xl font-bold text-shield-critical">{stats.active}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">High-Risk Users</p>
          <p className="text-3xl font-bold text-shield-high">{stats.highRisk}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Cleared Today</p>
          <p className="text-3xl font-bold text-green-400">4</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Max Risk Score</p>
          <p className="text-3xl font-bold text-orange-400">{stats.maxRisk}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Behavioral Alerts</h3>
            <DataTable<BehavioralAlert>
              columns={[
                { header: 'User', key: 'user_name', sortable: true },
                { header: 'Alert Type', key: 'alert_type', render: (v) => v.replace('_', ' ').toUpperCase() },
                { header: 'Severity', key: 'severity', render: (v) => <SeverityBadge severity={v} /> },
                { header: 'Risk Score', key: 'risk_score', render: (v) => <span className={v >= 75 ? 'text-red-400 font-bold' : v >= 50 ? 'text-orange-400' : 'text-green-400'}>{v}</span> },
                { header: 'System', key: 'source_system' },
                { header: 'Time', key: 'occurred_at', render: (v) => new Date(v).toLocaleTimeString() },
                { header: 'Status', key: 'status', render: (v) => <span className="text-xs bg-slate-800 px-2 py-1 rounded capitalize">{v}</span> }
              ]}
              data={alerts}
              onRowClick={setSelectedAlert}
              loading={loading}
              searchable
              searchKeys={['user_name', 'alert_type']}
            />
          </div>
        </div>

        {selectedAlert && (
          <div className="bg-slate-900 border border-shield-accent rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Alert Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">User</p>
                <p className="font-semibold">{selectedAlert.user_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Activity</p>
                <p className="text-sm">{selectedAlert.activity}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Details</p>
                <p className="text-sm">{selectedAlert.details}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-semibold">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {['investigating', 'cleared', 'escalated'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedAlert.id, status)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        selectedAlert.status === status
                          ? 'bg-shield-accent text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-gray-300'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => analyze('behavioral_risk', selectedAlert)}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Analyzing...' : 'Investigate with AI'}
              </button>
              <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
