import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { AgentLedgerEntry } from '../types/security.types.js';
import DataTable from '../components/shared/DataTable.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { Copy, Download } from 'lucide-react';

export default function AgentLedger() {
  const { user } = useSecurityStore();
  const [entries, setEntries] = useState<AgentLedgerEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<AgentLedgerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

    const fetchEntries = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${project}/agent-ledger`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEntries(res.data);
      } catch (err) {
        console.error('Failed to fetch ledger', err);
      } finally {
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

  const handleCopy = (hash: string) => {
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
    } catch (err) {
      console.error('Failed to export ledger', err);
    }
  };

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return 'bg-green-900 text-green-200';
      case 'partial': return 'bg-yellow-900 text-yellow-200';
      case 'failed': return 'bg-red-900 text-red-200';
      case 'blocked': return 'bg-orange-900 text-orange-200';
      default: return 'bg-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Total Actions</p>
          <p className="text-3xl font-bold text-shield-accent">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">High-Risk</p>
          <p className="text-3xl font-bold text-shield-high">{stats.highRisk}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Blocked</p>
          <p className="text-3xl font-bold text-shield-critical">{stats.blocked}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Active Agents</p>
          <p className="text-3xl font-bold text-shield-accent">{stats.activeAgents}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Agent Ledger</h3>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm rounded transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <DataTable<AgentLedgerEntry>
              columns={[
                { header: 'Timestamp', key: 'executed_at', render: (v) => new Date(v).toLocaleString() },
                { header: 'Agent', key: 'agent_name' },
                { header: 'Action', key: 'action_type' },
                { header: 'Target', key: 'target_object' },
                { header: 'Outcome', key: 'outcome', render: (v) => <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${outcomeColor(v)}`}>{v}</span> },
                { header: 'Risk Level', key: 'risk_level', render: (v) => <span className={v === 'high' ? 'text-red-400' : v === 'medium' ? 'text-yellow-400' : 'text-green-400'}>{v}</span> },
                { header: 'Hash', key: 'hash', render: (v) => <span className="font-mono text-xs">{v.substring(0, 12)}…</span> }
              ]}
              data={entries}
              onRowClick={setSelectedEntry}
              loading={loading}
              searchable
              searchKeys={['agent_name', 'action_type', 'target_object']}
            />
          </div>
        </div>

        {selectedEntry && (
          <div className="bg-slate-900 border border-shield-accent rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Entry Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Timestamp</p>
                <p className="text-sm">{new Date(selectedEntry.executed_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Agent</p>
                <p className="font-semibold">{selectedEntry.agent_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Summary</p>
                <p className="text-sm">{selectedEntry.action_summary}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Data Accessed</p>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-x-auto max-h-24">
                  {selectedEntry.data_accessed ? JSON.stringify(JSON.parse(selectedEntry.data_accessed || '{}'), null, 2) : 'None'}
                </pre>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Chain Hash</p>
                <div className="flex items-center gap-2">
                  <code className="bg-slate-800 px-2 py-1 rounded text-xs flex-1 overflow-x-auto">{selectedEntry.hash}</code>
                  <button
                    onClick={() => handleCopy(selectedEntry.hash)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => analyze('explain_agent_action', selectedEntry)}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Analyzing...' : 'Explain Action'}
              </button>
              <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
