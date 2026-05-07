export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'in_review' | 'remediated' | 'accepted';
export type AlertStatus = 'open' | 'investigating' | 'cleared' | 'escalated';
export type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
export type AnalysisMode = 'ciso_brief' | 'remediation_plan' | 'code_fix' | 'data_risk' | 'audit_evidence' | 'behavioral_risk' | 'explain_agent_action' | 'handover_narrative';
export type UserRole = 'ciso' | 'project_manager' | 'security_analyst' | 'auditor';
export type MigrationType = 'greenfield' | 'brownfield' | 'selective_data';
export type MigrationPhase = 'assess' | 'design' | 'realize' | 'deploy' | 'run';
export type FindingType = 'sod_violation' | 'privileged_access' | 'orphaned_role' | 'critical_auth';
export type CodeFindingType = 'missing_auth_check' | 'hardcoded_credential' | 'sql_injection' | 'rfc_abuse' | 'open_cursor';
export type ObjectType = 'PROG' | 'FUGR' | 'CLAS';
export type PIIType = 'salary' | 'national_id' | 'bank_account' | 'health_data' | 'email' | 'phone';
export type Regulation = 'GDPR' | 'DPDP' | 'HIPAA' | 'SOX';
export type Framework = 'SOX' | 'GDPR' | 'DPDP' | 'SAP_BASELINE';
export type AlertType = 'mass_data_export' | 'off_hours_access' | 'privilege_escalation' | 'unusual_tcode' | 'transport_anomaly';
export type AgentOutcome = 'success' | 'partial' | 'failed' | 'blocked';
export type RiskLevel = 'none' | 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  project_id: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  migration_type: MigrationType;
  source_system: string;
  target_system: string;
  phase: MigrationPhase;
  overall_risk_score: number;
  compliance_score: number;
  created_at: string;
}

export interface AuthFinding {
  id: string;
  project_id: string;
  finding_type: FindingType;
  severity: Severity;
  role_name: string;
  tcode_1?: string;
  tcode_2?: string;
  user_count: number;
  description: string;
  remediation: string;
  status: FindingStatus;
  detected_at: string;
}

export interface CodeFinding {
  id: string;
  project_id: string;
  object_name: string;
  object_type: ObjectType;
  finding_type: CodeFindingType;
  severity: Severity;
  line_number?: number;
  code_snippet?: string;
  description: string;
  remediation: string;
  cvss_score?: number;
  status: FindingStatus;
  detected_at: string;
}

export interface DataFinding {
  id: string;
  project_id: string;
  dataset_name: string;
  table_name: string;
  field_name: string;
  pii_type: PIIType;
  regulation: Regulation;
  record_count: number;
  masked: boolean;
  description: string;
  detected_at: string;
}

export interface ComplianceControl {
  id: string;
  project_id: string;
  framework: Framework;
  control_id: string;
  control_name: string;
  control_description: string;
  status: ComplianceStatus;
  evidence?: string;
  last_assessed?: string;
  assigned_to?: string;
}

export interface BehavioralAlert {
  id: string;
  project_id: string;
  user_id?: string;
  user_name: string;
  alert_type: AlertType;
  severity: Severity;
  source_system: string;
  activity: string;
  risk_score: number;
  details: string;
  status: AlertStatus;
  occurred_at: string;
}

export interface AgentLedgerEntry {
  id: string;
  project_id: string;
  agent_name: string;
  action_type: string;
  target_object: string;
  action_summary: string;
  data_accessed?: string;
  outcome: AgentOutcome;
  risk_level: RiskLevel;
  user_id?: string;
  hash: string;
  executed_at: string;
}

// VSE-specific types
export type VSEFindingType =
  | 'open_rfc_destination'
  | 'default_user_active'
  | 'debug_access_granted'
  | 'icf_service_exposed'
  | 'profile_parameter_misconfiguration'
  | 'gateway_security_gap';

export interface VSEFinding {
  id: string;
  project_id: string;
  scan_type: 'production_scan' | 'regression_check';
  finding_type: VSEFindingType;
  severity: Severity;
  affected_object: string;
  system_component: string;
  description: string;
  technical_detail: string;
  remediation: string;
  cvss_score?: number;
  status: FindingStatus | string;
  scan_triggered_by?: string;
  detected_at: number;
}

export interface VSEChangeEvent {
  id: string;
  project_id: string;
  event_type: 'transport_deployed' | 'role_modified' | 'user_batch_created' | 'parameter_changed';
  event_description: string;
  triggered_by: string;
  object_name?: string;
  regression_status?: string;
  findings_count?: number;
  occurred_at: number;
}

export interface VSEHandoverReport {
  id: string;
  project_id: string;
  generated_at: number;
  generated_by: string;
  final_security_score: number;
  pre_golive_findings_total: number;
  pre_golive_findings_remediated: number;
  pre_golive_findings_accepted: number;
  post_golive_findings_total: number;
  post_golive_findings_open: number;
  regression_checks_run: number;
  regression_issues_found: number;
  baseline_snapshot: string;
  open_risk_items?: string;
  ai_narrative?: string;
  report_status?: string;
  ciso_signed_off_by?: string;
  ciso_signed_off_at?: number;
}

export interface VSEMonitoring {
  id: string;
  project_id: string;
  check_type: string;
  frequency: 'on_change' | 'daily' | 'weekly';
  last_run?: number;
  last_result?: string;
  findings_since_baseline?: number;
  active?: number;
}

export interface VSESummary {
  project_id: string;
  total_findings: number;
  critical_open: number;
  high_open: number;
  medium_open: number;
  low_open: number;
  post_golive_findings_total: number;
  vse_risk_score: number;
}

export interface RecentFinding {
  id: string;
  type: 'auth' | 'code' | 'data' | 'alert' | 'compliance';
  title: string;
  severity: Severity;
  timestamp: string;
}

export interface DashboardSummary {
  overall_risk_score: number;
  compliance_score: number;
  critical_count: number;
  high_count: number;
  open_alerts: number;
  masked_datasets: number;
  findings_by_module: Record<string, number>;
  recent_findings: RecentFinding[];
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AIAnalysisRequest {
  mode: AnalysisMode;
  context: unknown;
  project_id?: string;
}

export interface AIAnalysisResponse {
  analysis: string;
}
