import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

type PiiType = 'salary' | 'national_id' | 'bank_account' | 'health_data' | 'email' | 'phone';
type Regulation = 'GDPR' | 'DPDP' | 'HIPAA' | 'SOX';

export interface TDSLPiiRule {
  id: string;
  rule_code: string;
  table_name: string;
  field_name: string;
  pii_type: PiiType;
  regulation: Regulation;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  is_active: number;
}

export interface DatasetColumn {
  raw: string;
  tableName?: string;
  fieldName: string;
}

export interface TDSLScanInput {
  projectId: string;
  datasetName: string;
  columns: string[];
  recordCount: number;
  defaultTableName?: string;
}

export interface TDSLScanResult {
  datasetName: string;
  scannedColumns: number;
  recordsScanned: number;
  rulesEvaluated: number;
  matchesFound: number;
  findingsInserted: number;
  findings: any[];
}

export class TDSLService {
  constructor(private db: MockDatabase) {}

  scanDataset(input: TDSLScanInput): TDSLScanResult {
    const rules = this.getActiveRules();
    const columns = input.columns.map((column) => this.parseColumn(column, input.defaultTableName));
    const matches = this.matchColumnsToRules(columns, rules);
    const findings = matches.map(({ rule, column }) => this.insertFinding(input, rule, column));

    return {
      datasetName: input.datasetName,
      scannedColumns: input.columns.length,
      recordsScanned: input.recordCount,
      rulesEvaluated: rules.length,
      matchesFound: matches.length,
      findingsInserted: findings.length,
      findings
    };
  }

  getActiveRules(): TDSLPiiRule[] {
    const rules = this.db.prepare('SELECT * FROM tdsl_pii_rules').all() as TDSLPiiRule[];
    return rules.filter((rule) => rule.is_active === undefined || Number(rule.is_active) === 1);
  }

  private matchColumnsToRules(columns: DatasetColumn[], rules: TDSLPiiRule[]) {
    const seen = new Set<string>();
    const matches: Array<{ rule: TDSLPiiRule; column: DatasetColumn }> = [];

    columns.forEach((column) => {
      rules.forEach((rule) => {
        const tableMatches = !column.tableName || this.normalize(column.tableName) === this.normalize(rule.table_name);
        const fieldMatches = this.normalize(column.fieldName) === this.normalize(rule.field_name);

        if (tableMatches && fieldMatches) {
          const key = `${rule.table_name}.${rule.field_name}`;
          if (!seen.has(key)) {
            seen.add(key);
            matches.push({ rule, column });
          }
        }
      });
    });

    return matches;
  }

  private insertFinding(input: TDSLScanInput, rule: TDSLPiiRule, column: DatasetColumn) {
    const id = uuidv4();
    const tableName = column.tableName || rule.table_name;
    const description = `${rule.description}. Matched uploaded column "${column.raw}" in dataset "${input.datasetName}".`;

    this.db.prepare(`INSERT INTO data_findings (id, project_id, dataset_name, table_name, field_name, pii_type, regulation, record_count, masked, description, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      input.projectId,
      input.datasetName,
      tableName,
      rule.field_name,
      rule.pii_type,
      rule.regulation,
      input.recordCount,
      0,
      description,
      new Date().toISOString()
    );

    return {
      id,
      project_id: input.projectId,
      dataset_name: input.datasetName,
      table_name: tableName,
      field_name: rule.field_name,
      pii_type: rule.pii_type,
      regulation: rule.regulation,
      record_count: input.recordCount,
      masked: 0,
      description,
      detected_at: new Date().toISOString()
    };
  }

  private parseColumn(rawColumn: string, defaultTableName?: string): DatasetColumn {
    const raw = rawColumn.trim();
    const cleaned = raw.replace(/^"|"$/g, '').trim();
    const parts = cleaned.split(/[.\-_:~/\\]+/).filter(Boolean);

    if (parts.length >= 2) {
      return {
        raw,
        tableName: parts[0],
        fieldName: parts[parts.length - 1]
      };
    }

    return {
      raw,
      tableName: defaultTableName?.trim() || undefined,
      fieldName: cleaned
    };
  }

  private normalize(value: string): string {
    return value.replace(/[^a-z0-9]/gi, '').toUpperCase();
  }
}
