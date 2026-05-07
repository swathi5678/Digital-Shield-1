import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

type CodeFindingType = 'missing_auth_check' | 'hardcoded_credential' | 'sql_injection' | 'rfc_abuse' | 'open_cursor';
type ObjectType = 'PROG' | 'FUGR' | 'CLAS';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface AbapRule {
  findingType: CodeFindingType;
  severity: Severity;
  cvss: number;
  description: string;
  remediation: string;
  test: (source: string) => boolean;
  linePattern: RegExp;
}

export interface CodeScanInput {
  projectId: string;
  objectName: string;
  objectType: ObjectType;
  sourceCode: string;
}

const abapRules: AbapRule[] = [
  {
    findingType: 'missing_auth_check',
    severity: 'critical',
    cvss: 9.1,
    description: 'Sensitive table access appears without an AUTHORITY-CHECK in the same program.',
    remediation: 'Add an AUTHORITY-CHECK before reading sensitive SAP tables and fail closed on sy-subrc.',
    test: (source) => /\bSELECT\b[\s\S]*\bFROM\s+(BKPF|BSEG|PA0008|PA0002|LFA1|KNA1|USR02)\b/i.test(source) && !/\bAUTHORITY-CHECK\b/i.test(source),
    linePattern: /\bSELECT\b.*\bFROM\s+(BKPF|BSEG|PA0008|PA0002|LFA1|KNA1|USR02)\b/i
  },
  {
    findingType: 'hardcoded_credential',
    severity: 'critical',
    cvss: 9.4,
    description: 'Hardcoded credential-like value detected in ABAP source.',
    remediation: 'Move secrets to a secure credential store and rotate exposed values immediately.',
    test: (source) => /\b(PASSWORD|PASSWD|PWD|SECRET|TOKEN)\b\s*=\s*['"][^'"]+['"]/i.test(source),
    linePattern: /\b(PASSWORD|PASSWD|PWD|SECRET|TOKEN)\b\s*=\s*['"][^'"]+['"]/i
  },
  {
    findingType: 'sql_injection',
    severity: 'high',
    cvss: 8.2,
    description: 'Dynamic SQL construction may allow unsafe query injection.',
    remediation: 'Avoid string-built SQL; use parameterized Open SQL and validate user-controlled values.',
    test: (source) => /\b(EXEC\s+SQL|ADBC|cl_sql_statement|SELECT\s+\([^)]+\))/i.test(source) && /\b(CONCATENATE|&&|\|\|)\b/i.test(source),
    linePattern: /\b(EXEC\s+SQL|ADBC|cl_sql_statement|SELECT\s+\([^)]+\))/i
  },
  {
    findingType: 'rfc_abuse',
    severity: 'high',
    cvss: 7.8,
    description: 'Remote function call usage detected without a nearby authorization check.',
    remediation: 'Validate destination and user authorization before RFC execution; restrict trusted RFC destinations.',
    test: (source) => /\bCALL\s+FUNCTION\b[\s\S]*\bDESTINATION\b/i.test(source) && !/\bAUTHORITY-CHECK\b/i.test(source),
    linePattern: /\bCALL\s+FUNCTION\b/i
  },
  {
    findingType: 'open_cursor',
    severity: 'medium',
    cvss: 5.9,
    description: 'Database cursor is opened without an explicit close.',
    remediation: 'Close every opened cursor and prefer bounded SELECT loops where possible.',
    test: (source) => /\bOPEN\s+CURSOR\b/i.test(source) && !/\bCLOSE\s+CURSOR\b/i.test(source),
    linePattern: /\bOPEN\s+CURSOR\b/i
  }
];

export class SecureCodeGuardianService {
  constructor(private db: MockDatabase) {}

  scanAbap(input: CodeScanInput) {
    const findings = abapRules
      .filter((rule) => rule.test(input.sourceCode))
      .map((rule) => this.insertFinding(input, rule));

    return {
      objectName: input.objectName,
      objectType: input.objectType,
      rulesEvaluated: abapRules.length,
      findingsInserted: findings.length,
      findings
    };
  }

  private insertFinding(input: CodeScanInput, rule: AbapRule) {
    const id = uuidv4();
    const detectedAt = new Date().toISOString();
    const lineNumber = this.findLineNumber(input.sourceCode, rule.linePattern);
    const codeSnippet = this.extractSnippet(input.sourceCode, lineNumber);

    const finding = {
      id,
      project_id: input.projectId,
      object_name: input.objectName,
      object_type: input.objectType,
      finding_type: rule.findingType,
      severity: rule.severity,
      line_number: lineNumber,
      code_snippet: codeSnippet,
      description: rule.description,
      remediation: rule.remediation,
      cvss_score: rule.cvss,
      status: 'open',
      detected_at: detectedAt
    };

    this.db.prepare(`INSERT INTO code_findings (id, project_id, object_name, object_type, finding_type, severity, line_number, code_snippet, description, remediation, cvss_score, status, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      finding.id,
      finding.project_id,
      finding.object_name,
      finding.object_type,
      finding.finding_type,
      finding.severity,
      finding.line_number,
      finding.code_snippet,
      finding.description,
      finding.remediation,
      finding.cvss_score,
      finding.status,
      finding.detected_at
    );

    return finding;
  }

  private findLineNumber(source: string, pattern: RegExp): number {
    const lines = source.split(/\r?\n/);
    const index = lines.findIndex((line) => pattern.test(line));
    return index >= 0 ? index + 1 : 1;
  }

  private extractSnippet(source: string, lineNumber: number): string {
    const lines = source.split(/\r?\n/);
    const start = Math.max(lineNumber - 2, 0);
    const end = Math.min(lineNumber + 1, lines.length);
    return lines.slice(start, end).join('\n').slice(0, 1000);
  }
}
