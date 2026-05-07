import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

type ComplianceStatus = 'compliant' | 'non_compliant' | 'partial' | 'not_assessed';
type Framework = 'SOX' | 'GDPR' | 'DPDP' | 'SAP_BASELINE';

interface GeneratedControl {
  framework: Framework;
  controlId: string;
  controlName: string;
  description: string;
  status: ComplianceStatus;
  evidence: string;
  assignedTo: string;
}

export class CompliancePostureService {
  constructor(private db: MockDatabase) {}

  assessProject(projectId: string) {
    const authOpen = this.countRows('auth_findings', projectId, (row) => row.status === 'open');
    const criticalAuth = this.countRows('auth_findings', projectId, (row) => row.severity === 'critical' && row.status === 'open');
    const codeOpen = this.countRows('code_findings', projectId, (row) => row.status === 'open');
    const unmaskedPii = this.countRows('data_findings', projectId, (row) => Number(row.masked) !== 1);
    const behaviorOpen = this.countRows('behavioral_alerts', projectId, (row) => row.status === 'open');
    const vseCritical = this.countRows('vse_findings', projectId, (row) => row.severity === 'critical' && row.status === 'open');

    const controls: GeneratedControl[] = [
      {
        framework: 'SOX',
        controlId: 'AUTO_SOX_SOD_001',
        controlName: 'Automated SoD Conflict Monitoring',
        description: 'Evaluates open authorization and SoD conflicts affecting financial controls.',
        status: criticalAuth > 0 ? 'non_compliant' : authOpen > 0 ? 'partial' : 'compliant',
        evidence: `${authOpen} open authorization findings; ${criticalAuth} critical open findings.`,
        assignedTo: 'security_analyst'
      },
      {
        framework: 'GDPR',
        controlId: 'AUTO_GDPR_PII_001',
        controlName: 'Non-Production PII Masking',
        description: 'Evaluates whether detected PII fields in test data are masked.',
        status: unmaskedPii > 5 ? 'non_compliant' : unmaskedPii > 0 ? 'partial' : 'compliant',
        evidence: `${unmaskedPii} unmasked PII findings currently require remediation.`,
        assignedTo: 'data_privacy_officer'
      },
      {
        framework: 'DPDP',
        controlId: 'AUTO_DPDP_DATA_001',
        controlName: 'Personal Data Exposure Control',
        description: 'Tracks DPDP-sensitive exposure in uploaded SAP datasets.',
        status: unmaskedPii > 0 ? 'partial' : 'compliant',
        evidence: `${unmaskedPii} data findings are unmasked across scanned datasets.`,
        assignedTo: 'data_privacy_officer'
      },
      {
        framework: 'SAP_BASELINE',
        controlId: 'AUTO_SAP_SECURITY_001',
        controlName: 'SAP Technical Security Baseline',
        description: 'Combines code, behavioral, and VSE signals into a baseline control posture.',
        status: vseCritical > 0 || codeOpen > 10 || behaviorOpen > 10 ? 'non_compliant' : codeOpen > 0 || behaviorOpen > 0 ? 'partial' : 'compliant',
        evidence: `${codeOpen} open code findings; ${behaviorOpen} open behavioral alerts; ${vseCritical} critical VSE findings.`,
        assignedTo: 'ciso'
      }
    ];

    const inserted = controls.map((control) => this.insertAssessment(projectId, control));

    return {
      controlsAssessed: controls.length,
      generatedAt: new Date().toISOString(),
      metrics: { authOpen, criticalAuth, codeOpen, unmaskedPii, behaviorOpen, vseCritical },
      controls: inserted
    };
  }

  private countRows(table: string, projectId: string, predicate: (row: any) => boolean): number {
    const rows = this.db.prepare(`SELECT * FROM ${table} WHERE project_id = ?`).all(projectId);
    return rows.filter((row) => row.project_id === projectId && predicate(row)).length;
  }

  private insertAssessment(projectId: string, control: GeneratedControl) {
    const row = {
      id: uuidv4(),
      project_id: projectId,
      framework: control.framework,
      control_id: control.controlId,
      control_name: control.controlName,
      control_description: control.description,
      status: control.status,
      evidence: control.evidence,
      last_assessed: new Date().toISOString(),
      assigned_to: control.assignedTo
    };

    this.db.prepare(`INSERT INTO compliance_controls (id, project_id, framework, control_id, control_name, control_description, status, evidence, last_assessed, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      row.id,
      row.project_id,
      row.framework,
      row.control_id,
      row.control_name,
      row.control_description,
      row.status,
      row.evidence,
      row.last_assessed,
      row.assigned_to
    );

    return row;
  }
}
