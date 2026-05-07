import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { AuthFinding } from '../types/security.types.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import SoDUploadComponent from '../components/modules/SoDUploadComponent.js';
import SoDResultsComponent from '../components/modules/SoDResultsComponent.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AuthorizationIntelligence() {
  const { user } = useSecurityStore();
  const [findings, setFindings] = useState<AuthFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<AuthFinding | null>(null);
  const [loading, setLoading] = useState(true);
  const [sodResults, setSodResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'traditional' | 'sod'>('sod');
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

    const fetchFindings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${project}/auth-findings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFindings(res.data);
        localStorage.setItem('project_id', project);
      } catch (err) {
        console.error('Failed to fetch findings', err);
      } finally {
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

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('sod')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'sod'
              ? 'border-shield-accent text-shield-accent'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          SoD Detection (NEW)
        </button>
        <button
          onClick={() => setActiveTab('traditional')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'traditional'
              ? 'border-shield-accent text-shield-accent'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Traditional Findings
        </button>
      </div>

      {/* SoD Detection Tab */}
      {activeTab === 'sod' && (
        <div className="space-y-6">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zm-11-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-blue-200 mb-1">Product-Market Fit Ready</p>
              <p className="text-sm text-blue-300">Upload your AGR_USERS and AGR_1251 CSVs from SAP. The detection engine will identify segregation of duties violations across roles and user assignments - violations that competitors miss during mid-migration projects.</p>
            </div>
          </div>

          <SoDUploadComponent 
            projectId={projectId}
            onDetectionComplete={(results) => {
              setSodResults(results);
              setActiveTab('sod');
            }}
          />

          {sodResults && <SoDResultsComponent projectId={projectId} results={sodResults} />}
        </div>
      )}

      {/* Traditional Findings Tab */}
      {activeTab === 'traditional' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsData.map((stat) => (
              <div key={stat.label} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-xs text-gray-400 font-semibold mb-2">{stat.label}</p>
                <p className="text-3xl font-bold text-shield-accent">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Authorization Findings</h3>
                <DataTable<AuthFinding>
                  columns={[
                    { header: 'Role', key: 'role_name', sortable: true },
                    { header: 'Type', key: 'finding_type', render: (v) => v.replace('_', ' ').toUpperCase() },
                    { header: 'T-Code Conflict', key: 'tcode_1', render: (v, row) => row.tcode_2 ? `${v} / ${row.tcode_2}` : v },
                    { header: 'Severity', key: 'severity', render: (v) => <SeverityBadge severity={v} /> },
                    { header: 'Users', key: 'user_count', sortable: true },
                    { header: 'Status', key: 'status', render: (v) => <span className="text-xs bg-slate-800 px-2 py-1 rounded capitalize">{v}</span> }
                  ]}
                  data={findings}
                  onRowClick={setSelectedFinding}
                  loading={loading}
                  searchable
                  searchKeys={['role_name', 'tcode_1', 'tcode_2']}
                />
              </div>
            </div>

            {selectedFinding && (
              <div className="bg-slate-900 border border-shield-accent rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Finding Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Role</p>
                    <p className="font-mono text-sm">{selectedFinding.role_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Type</p>
                    <p className="text-sm capitalize">{selectedFinding.finding_type.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">T-Code Conflict</p>
                    <p className="text-sm">{selectedFinding.tcode_1} + {selectedFinding.tcode_2}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Description</p>
                    <p className="text-sm">{selectedFinding.description}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Remediation</p>
                    <p className="text-sm">{selectedFinding.remediation}</p>
                  </div>
                  <button
                    onClick={() => analyze('remediation_plan', selectedFinding)}
                    disabled={aiLoading}
                    className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
                  >
                    {aiLoading ? 'Generating...' : 'AI Remediation Plan'}
                  </button>
                  <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Likelihood vs Impact</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" dataKey="x" name="Likelihood" stroke="#94a3b8" />
                <YAxis type="number" dataKey="y" name="Impact" stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Findings" data={scatterData} fill="#6C3BFF" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
