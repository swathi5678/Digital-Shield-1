import { MockDatabase } from '../db/schema.js';
import { v4 as uuidv4 } from 'uuid';
import { VSEFinding, VSEChangeEvent, VSEHandoverReport, VSESummary, VSEMonitoring } from '../types/index.js';

export class VSEService {
  constructor(private db: MockDatabase) {}

  getVSESummary(projectId: string): VSESummary {
    const total = this.db.prepare('SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ?').get(projectId)?.c || 0;
    const critical = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'critical' AND status = 'open'").get(projectId)?.c || 0;
    const high = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'high' AND status = 'open'").get(projectId)?.c || 0;
    const medium = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'medium' AND status = 'open'").get(projectId)?.c || 0;
    const low = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'low' AND status = 'open'").get(projectId)?.c || 0;
    const post_golive_total = this.db.prepare('SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND scan_type = ?').get(projectId, 'production_scan')?.c || 0;
    const risk = this.computeVSERiskScore(projectId);

    return {
      project_id: projectId,
      total_findings: total,
      critical_open: critical,
      high_open: high,
      medium_open: medium,
      low_open: low,
      post_golive_findings_total: post_golive_total,
      vse_risk_score: risk
    };
  }

  getVSEFindings(projectId: string, filters: { scan_type?: string; finding_type?: string; severity?: string; status?: string; search?: string }) {
    let query = 'SELECT * FROM vse_findings WHERE project_id = ?';
    const params: any[] = [projectId];

    if (filters.scan_type) { query += ' AND scan_type = ?'; params.push(filters.scan_type); }
    if (filters.finding_type) { query += ' AND finding_type = ?'; params.push(filters.finding_type); }
    if (filters.severity) { query += ' AND severity = ?'; params.push(filters.severity); }
    if (filters.status) { query += ' AND status = ?'; params.push(filters.status); }
    if (filters.search) { query += ' AND (affected_object LIKE ? OR description LIKE ? OR technical_detail LIKE ?)'; params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`); }

    query += ' ORDER BY detected_at DESC';
    return this.db.prepare(query).all(...params) as VSEFinding[];
  }

  updateVSEFindingStatus(findingId: string, status: string): void {
    this.db.prepare('UPDATE vse_findings SET status = ? WHERE id = ?').run(status, findingId);
  }

  getChangeEvents(projectId: string) {
    return this.db.prepare('SELECT * FROM vse_change_events WHERE project_id = ? ORDER BY occurred_at DESC').all(projectId) as VSEChangeEvent[];
  }

  getHandoverReport(projectId: string): VSEHandoverReport | null {
    const row = this.db.prepare('SELECT * FROM vse_handover_reports WHERE project_id = ?').get(projectId);
    return row || null;
  }

  updateHandoverStatus(projectId: string, status: string, signedOffBy?: string): void {
    if (signedOffBy) {
      this.db.prepare('UPDATE vse_handover_reports SET report_status = ?, ciso_signed_off_by = ?, ciso_signed_off_at = ? WHERE project_id = ?').run(status, signedOffBy, Date.now(), projectId);
    } else {
      this.db.prepare('UPDATE vse_handover_reports SET report_status = ? WHERE project_id = ?').run(status, projectId);
    }
  }

  getMonitoringConfig(projectId: string): VSEMonitoring[] {
    return this.db.prepare('SELECT * FROM vse_monitoring WHERE project_id = ?').all(projectId) as VSEMonitoring[];
  }

  computeVSERiskScore(projectId: string): number {
    const critical = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'critical' AND status = 'open'").get(projectId)?.c || 0;
    const high = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'high' AND status = 'open'").get(projectId)?.c || 0;
    const medium = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'medium' AND status = 'open'").get(projectId)?.c || 0;
    const low = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'low' AND status = 'open'").get(projectId)?.c || 0;

    let score = 100;
    score -= critical * 15;
    score -= high * 8;
    score -= medium * 4;
    score -= low * 2;
    if (score < 0) score = 0;
    return score;
  }

  computeFinalSecurityScore(projectId: string): number {
    // Simple aggregate: compute open findings across main modules and reduce from 100
    const authOpen = this.db.prepare("SELECT COUNT(*) as c FROM auth_findings WHERE project_id = ? AND status = 'open'").get(projectId)?.c || 0;
    const codeOpen = this.db.prepare("SELECT COUNT(*) as c FROM code_findings WHERE project_id = ? AND status = 'open'").get(projectId)?.c || 0;
    const dataOpen = this.db.prepare("SELECT COUNT(*) as c FROM data_findings WHERE project_id = ?").get(projectId)?.c || 0;
    const compNon = this.db.prepare("SELECT COUNT(*) as c FROM compliance_controls WHERE project_id = ? AND status != 'compliant'").get(projectId)?.c || 0;
    const behavOpen = this.db.prepare("SELECT COUNT(*) as c FROM behavioral_alerts WHERE project_id = ? AND status = 'open'").get(projectId)?.c || 0;
    const agentEntries = this.db.prepare("SELECT COUNT(*) as c FROM agent_ledger WHERE project_id = ?").get(projectId)?.c || 0;
    const vseOpen = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND status = 'open'").get(projectId)?.c || 0;

    const totalIssues = authOpen + codeOpen + dataOpen + compNon + behavOpen + agentEntries + vseOpen;
    let final = 100 - Math.min(80, totalIssues * 2); // each issue reduces score by 2 up to 80
    if (final < 0) final = 0;
    return final;
  }

  // Trigger a scan (simplified): create a finding entry or mark events
  triggerScan(projectId: string, scan_type: string, object?: string) {
    const id = uuidv4();
    const now = Date.now();
    const finding = {
      id,
      project_id: projectId,
      scan_type,
      finding_type: 'profile_parameter_misconfiguration',
      severity: 'medium',
      affected_object: object || 'SYSTEM: generic',
      system_component: 'RZ10',
      description: 'Automated triggered check',
      technical_detail: 'Triggered by API',
      remediation: 'Manual review',
      cvss_score: 5.0,
      status: 'open',
      scan_triggered_by: 'user',
      detected_at: now
    } as any;
    this.db.prepare(`INSERT INTO vse_findings (id, project_id, scan_type, finding_type, severity, affected_object, system_component, description, technical_detail, remediation, cvss_score, status, scan_triggered_by, detected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      finding.id, finding.project_id, finding.scan_type, finding.finding_type, finding.severity, finding.affected_object, finding.system_component, finding.description, finding.technical_detail, finding.remediation, finding.cvss_score, finding.status, finding.scan_triggered_by, finding.detected_at
    );
    return finding;
  }
}

export default VSEService;
