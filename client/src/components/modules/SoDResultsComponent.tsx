import { useState } from 'react';
import axios from 'axios';
import DataTable from '../shared/DataTable.js';
import SeverityBadge from '../shared/SeverityBadge.js';

interface SoDViolation {
  id: string;
  violation_type: 'user_has_both_tcodes' | 'role_has_both_tcodes' | 'user_via_multiple_roles';
  severity: 'critical' | 'high' | 'medium' | 'low';
  tcode_1: string;
  tcode_2: string;
  user_name?: string;
  role_1?: string;
  role_2?: string;
  affected_user_count: number;
  rule_name: string;
  description: string;
  remediation_suggestion: string;
}

interface SoDResultsComponentProps {
  projectId: string;
  results: any;
}

export default function SoDResultsComponent({ projectId, results }: SoDResultsComponentProps) {
  const [selectedViolation, setSelectedViolation] = useState<SoDViolation | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('');

  const violations = results.violations || [];
  const filteredViolations = filterSeverity 
    ? violations.filter((v: SoDViolation) => v.severity === filterSeverity)
    : violations;

  const criticalCount = violations.filter((v: SoDViolation) => v.severity === 'critical').length;
  const highCount = violations.filter((v: SoDViolation) => v.severity === 'high').length;
  const mediumCount = violations.filter((v: SoDViolation) => v.severity === 'medium').length;
  const lowCount = violations.filter((v: SoDViolation) => v.severity === 'low').length;

  const getViolationTypeLabel = (type: string) => {
    switch (type) {
      case 'user_has_both_tcodes':
        return 'Direct Assignment';
      case 'role_has_both_tcodes':
        return 'Role-based';
      case 'user_via_multiple_roles':
        return 'Multi-role';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">USERS ANALYZED</p>
          <p className="text-3xl font-bold text-shield-accent">{results.statistics?.usersCount || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">ROLES FOUND</p>
          <p className="text-3xl font-bold text-blue-400">{results.statistics?.rolesCount || 0}</p>
        </div>
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <p className="text-xs text-gray-400 font-semibold mb-2">TCODES SCANNED</p>
          <p className="text-3xl font-bold text-cyan-400">{results.statistics?.tcodesCount || 0}</p>
        </div>
        <div className="bg-slate-900 border border-red-700 rounded-lg p-4 border-2">
          <p className="text-xs text-red-300 font-semibold mb-2">VIOLATIONS FOUND</p>
          <p className="text-3xl font-bold text-red-400">{results.statistics?.violationsFound || 0}</p>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterSeverity('critical')}
          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-colors ${
            filterSeverity === 'critical' ? 'border-red-500 bg-red-900/20' : 'border-slate-700 hover:border-red-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 font-semibold mb-1">CRITICAL</p>
              <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div 
          onClick={() => setFilterSeverity('high')}
          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-colors ${
            filterSeverity === 'high' ? 'border-orange-500 bg-orange-900/20' : 'border-slate-700 hover:border-orange-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-400 font-semibold mb-1">HIGH</p>
              <p className="text-2xl font-bold text-orange-400">{highCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilterSeverity('medium')}
          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-colors ${
            filterSeverity === 'medium' ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-700 hover:border-yellow-500'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-400 font-semibold mb-1">MEDIUM</p>
              <p className="text-2xl font-bold text-yellow-400">{mediumCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-900/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-2a4 4 0 00-8 0v2h8z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setFilterSeverity('')}
          className={`bg-slate-900 border rounded-lg p-4 cursor-pointer transition-colors ${
            filterSeverity === '' ? 'border-slate-400 bg-slate-800' : 'border-slate-700 hover:border-slate-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-1">TOTAL</p>
              <p className="text-2xl font-bold text-gray-200">{violations.length}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-slate-700/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Violations Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">SoD Violations</h3>
            {filteredViolations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No violations found</p>
              </div>
            ) : (
              <DataTable<SoDViolation>
                columns={[
                  { header: 'Severity', key: 'severity', render: (v) => <SeverityBadge severity={v} /> },
                  { header: 'T-Code Conflict', key: 'tcode_1', render: (v, row) => `${v} / ${row.tcode_2}` },
                  { header: 'Type', key: 'violation_type', render: (v) => <span className="text-xs bg-slate-800 px-2 py-1 rounded">{getViolationTypeLabel(v)}</span> },
                  { header: 'Users Affected', key: 'affected_user_count', sortable: true },
                  { header: 'Rule', key: 'rule_name', render: (v) => <span className="text-xs font-mono text-blue-300">{v}</span> }
                ]}
                data={filteredViolations}
                onRowClick={setSelectedViolation}
                searchable
                searchKeys={['tcode_1', 'tcode_2', 'user_name', 'rule_name']}
              />
            )}
          </div>
        </div>

        {selectedViolation && (
          <div className="bg-slate-900 border border-shield-accent rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Violation Details</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">SEVERITY</p>
                <SeverityBadge severity={selectedViolation.severity} />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">VIOLATION TYPE</p>
                <p className="text-sm font-medium text-white">{getViolationTypeLabel(selectedViolation.violation_type)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">T-CODE CONFLICT</p>
                <p className="text-sm font-mono">{selectedViolation.tcode_1} + {selectedViolation.tcode_2}</p>
              </div>
              {selectedViolation.user_name && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">USER</p>
                  <p className="text-sm font-mono text-yellow-300">{selectedViolation.user_name}</p>
                </div>
              )}
              {selectedViolation.role_1 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">ROLES</p>
                  <div className="text-sm space-y-1">
                    {selectedViolation.role_1 && <p className="font-mono text-orange-300">{selectedViolation.role_1}</p>}
                    {selectedViolation.role_2 && <p className="font-mono text-orange-300">{selectedViolation.role_2}</p>}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 mb-1">AFFECTED USERS</p>
                <p className="text-sm font-bold text-red-400">{selectedViolation.affected_user_count}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">RULE</p>
                <p className="text-sm font-mono bg-slate-800 px-2 py-1 rounded">{selectedViolation.rule_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">DESCRIPTION</p>
                <p className="text-sm text-gray-300">{selectedViolation.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">REMEDIATION SUGGESTION</p>
                <p className="text-sm text-blue-200 bg-blue-900/20 p-2 rounded">{selectedViolation.remediation_suggestion}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
