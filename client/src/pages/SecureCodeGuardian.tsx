import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../store/securityStore.js';
import { CodeFinding } from '../types/security.types.js';
import DataTable from '../components/shared/DataTable.js';
import SeverityBadge from '../components/shared/SeverityBadge.js';
import AIInsightPanel from '../components/shared/AIInsightPanel.js';
import { useAIAnalysis } from '../hooks/useAIAnalysis.js';
import { PieChart, Pie, BarChart, Bar, Cell, Legend, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function SecureCodeGuardian() {
  const { user } = useSecurityStore();
  const [findings, setFindings] = useState<CodeFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding | null>(null);
  const [loading, setLoading] = useState(true);
  const { analyze, result, loading: aiLoading, error: aiError } = useAIAnalysis();

  useEffect(() => {
    const project = localStorage.getItem('project_id') || user?.project_id;
    if (!project) return;

    const fetchFindings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/projects/${project}/code-findings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFindings(res.data);
      } catch (err) {
        console.error('Failed to fetch findings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFindings();
  }, [user]);

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const avgCVSS = findings.reduce((sum, f) => sum + (f.cvss_score || 0), 0) / findings.length || 0;

  const findingTypeData = Object.entries(
    findings.reduce((acc, f) => {
      acc[f.finding_type] = (acc[f.finding_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace('_', ' '), value }));

  const objectTypeData = Object.entries(
    findings.reduce((acc, f) => {
      acc[f.object_type] = (acc[f.object_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const colors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Objects Scanned</p>
          <p className="text-3xl font-bold text-shield-accent">{findings.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">Critical</p>
          <p className="text-3xl font-bold text-shield-critical">{criticalCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">High</p>
          <p className="text-3xl font-bold text-shield-high">{highCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">CVSS Average</p>
          <p className="text-3xl font-bold text-yellow-400">{avgCVSS.toFixed(1)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Code Findings</h3>
            <DataTable<CodeFinding>
              columns={[
                { header: 'Object', key: 'object_name', sortable: true },
                { header: 'Type', key: 'object_type' },
                { header: 'Vulnerability', key: 'finding_type', render: (v) => v.replace('_', ' ') },
                { header: 'Line #', key: 'line_number' },
                { header: 'CVSS', key: 'cvss_score', render: (v) => v?.toFixed(1) || 'N/A' },
                { header: 'Severity', key: 'severity', render: (v) => <SeverityBadge severity={v} /> }
              ]}
              data={findings}
              onRowClick={setSelectedFinding}
              loading={loading}
              searchable
              searchKeys={['object_name', 'finding_type']}
            />
          </div>
        </div>

        {selectedFinding && (
          <div className="bg-slate-900 border border-shield-accent rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Finding Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Object</p>
                <p className="font-mono text-sm">{selectedFinding.object_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Code Snippet</p>
                <pre className="bg-slate-800 p-2 rounded text-xs overflow-x-auto">{selectedFinding.code_snippet}</pre>
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
                onClick={() => analyze('code_fix', selectedFinding)}
                disabled={aiLoading}
                className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white text-sm font-semibold rounded disabled:opacity-50 transition-colors"
              >
                {aiLoading ? 'Generating...' : 'AI Fix Suggestion'}
              </button>
              <AIInsightPanel result={result} loading={aiLoading} error={aiError} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Vulnerability Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={findingTypeData} dataKey="value" cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80}>
                {findingTypeData.map((_, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Object Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={objectTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
              <Bar dataKey="value" fill="#6C3BFF" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
