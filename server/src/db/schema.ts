// Mock in-memory database for prototype demo (avoids C++ compilation requirements)
import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import { createHash } from 'crypto';

export interface MockDatabase {
  prepare(sql: string): { run(...args: any[]): void; get(...args: any[]): any; all(...args: any[]): any[] };
  exec(sql: string): void;
  pragma(cmd: string): void;
}

class InMemoryDatabase implements MockDatabase {
  private tables: Map<string, any[]> = new Map();
  private indexes: Map<string, Set<any>> = new Map();

  prepare(sql: string) {
    const trimmed = sql.trim();
    
    if (trimmed.toUpperCase().startsWith('INSERT INTO')) {
      return {
        run: (...args: any[]) => this.handleInsert(sql, args),
        get: () => null,
        all: () => []
      };
    } else if (trimmed.toUpperCase().startsWith('SELECT')) {
      return {
        run: () => null,
        get: (...args: any[]) => this.handleSelect(sql, args, true),
        all: (...args: any[]) => this.handleSelect(sql, args, false)
      };
    } else if (trimmed.toUpperCase().startsWith('UPDATE')) {
      return {
        run: (...args: any[]) => this.handleUpdate(sql, args),
        get: () => null,
        all: () => []
      };
    } else if (trimmed.toUpperCase().startsWith('DELETE')) {
      return {
        run: (...args: any[]) => this.handleDelete(sql, args),
        get: () => null,
        all: () => []
      };
    }

    return {
      run: () => null,
      get: () => null,
      all: () => []
    };
  }

  private handleInsert(sql: string, args: any[]) {
    const match = sql.match(/INSERT INTO (\w+)/i);
    if (!match) return;
    
    const table = match[1];
    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    
    const row: any = {};
    const cols = sql.match(/\((.*?)\)/)?.[1]?.split(',').map(c => c.trim()) || [];
    cols.forEach((col, i) => {
      row[col] = args[i];
    });
    
    this.tables.get(table)!.push(row);
  }

  private handleUpdate(sql: string, args: any[]) {
    const match = sql.match(/UPDATE (\w+) SET/i);
    if (!match) return;
    
    const table = match[1];
    const rows = this.tables.get(table) || [];
    const whereMatch = sql.match(/WHERE (.*?)($|;)/i);
    
    if (whereMatch) {
      const condition = whereMatch[1];
      rows.forEach(row => {
        if (this.evaluateCondition(row, condition, args)) {
          const setClauses = sql.match(/SET (.*?) WHERE/i)?.[1] || '';
          const updates = setClauses.split(',').map(s => s.trim());
          let argIdx = 0;
          updates.forEach(update => {
            const [col] = update.split('=').map(s => s.trim());
            row[col] = args[argIdx++];
          });
        }
      });
    }
  }

  private handleDelete(sql: string, args: any[]) {
    const match = sql.match(/DELETE FROM (\w+)/i);
    if (!match) return;
    
    const table = match[1];
    const rows = this.tables.get(table) || [];
    const whereMatch = sql.match(/WHERE (.*?)($|;)/i);
    
    if (whereMatch) {
      const condition = whereMatch[1];
      const idx = rows.findIndex(row => this.evaluateCondition(row, condition, args));
      if (idx >= 0) rows.splice(idx, 1);
    }
  }

  private handleSelect(sql: string, args: any[], single: boolean) {
    const match = sql.match(/FROM (\w+)/i);
    if (!match) return single ? null : [];
    
    const table = match[1];
    let rows = [...(this.tables.get(table) || [])];
    
    const whereMatch = sql.match(/WHERE (.*?)($|ORDER|;)/i);
    if (whereMatch) {
      const condition = whereMatch[1];
      rows = rows.filter(row => this.evaluateCondition(row, condition, args));
    }
    
    const orderMatch = sql.match(/ORDER BY (.*?)($|;)/i);
    if (orderMatch) {
      const [col, dir] = orderMatch[1].match(/(\w+)\s*(ASC|DESC)?/i)?.slice(1) || [];
      rows.sort((a, b) => {
        const cmp = a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0;
        return dir === 'DESC' ? -cmp : cmp;
      });
    }
    
    return single ? rows[0] || null : rows;
  }

  private evaluateCondition(row: any, condition: string, args: any[]): boolean {
    let argIdx = 0;
    const expr = condition.replace(/\?/g, () => {
      const val = args[argIdx++];
      return typeof val === 'string' ? `'${val}'` : String(val);
    });
    
    try {
      return Function(`with (this) { return ${expr}; }`).call(row);
    } catch {
      return true;
    }
  }

  exec(sql: string) {
    const statements = sql.split(';').filter(s => s.trim());
    statements.forEach(stmt => {
      const trimmed = stmt.trim();
      if (trimmed.toUpperCase().startsWith('CREATE TABLE')) {
        const match = trimmed.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
        if (match && !this.tables.has(match[1])) {
          this.tables.set(match[1], []);
        }
      } else if (trimmed.toUpperCase().startsWith('CREATE INDEX')) {
        // No-op for mock
      }
    });
  }

  pragma(cmd: string) {
    // No-op for mock
  }
}

export function initializeDatabase(): MockDatabase {
  const db = new InMemoryDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ciso', 'project_manager', 'security_analyst', 'auditor')),
      project_id TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client TEXT NOT NULL,
      migration_type TEXT NOT NULL CHECK (migration_type IN ('greenfield', 'brownfield', 'selective_data')),
      source_system TEXT NOT NULL,
      target_system TEXT NOT NULL,
      phase TEXT NOT NULL CHECK (phase IN ('assess', 'design', 'realize', 'deploy', 'run')),
      overall_risk_score INTEGER DEFAULT 0,
      compliance_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_findings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      finding_type TEXT NOT NULL CHECK (finding_type IN ('sod_violation', 'privileged_access', 'orphaned_role', 'critical_auth')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
      role_name TEXT NOT NULL,
      tcode_1 TEXT,
      tcode_2 TEXT,
      user_count INTEGER DEFAULT 0,
      description TEXT NOT NULL,
      remediation TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'remediated', 'accepted')),
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS code_findings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      object_name TEXT NOT NULL,
      object_type TEXT NOT NULL CHECK (object_type IN ('PROG', 'FUGR', 'CLAS')),
      finding_type TEXT NOT NULL CHECK (finding_type IN ('missing_auth_check', 'hardcoded_credential', 'sql_injection', 'rfc_abuse', 'open_cursor')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
      line_number INTEGER,
      code_snippet TEXT,
      description TEXT NOT NULL,
      remediation TEXT NOT NULL,
      cvss_score REAL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'remediated', 'accepted')),
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS data_findings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      dataset_name TEXT NOT NULL,
      table_name TEXT NOT NULL,
      field_name TEXT NOT NULL,
      pii_type TEXT NOT NULL CHECK (pii_type IN ('salary', 'national_id', 'bank_account', 'health_data', 'email', 'phone')),
      regulation TEXT NOT NULL CHECK (regulation IN ('GDPR', 'DPDP', 'HIPAA', 'SOX')),
      record_count INTEGER DEFAULT 0,
      masked INTEGER DEFAULT 0,
      description TEXT NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS tdsl_pii_rules (
      id TEXT PRIMARY KEY,
      rule_code TEXT NOT NULL UNIQUE,
      table_name TEXT NOT NULL,
      field_name TEXT NOT NULL,
      pii_type TEXT NOT NULL CHECK (pii_type IN ('salary', 'national_id', 'bank_account', 'health_data', 'email', 'phone')),
      regulation TEXT NOT NULL CHECK (regulation IN ('GDPR', 'DPDP', 'HIPAA', 'SOX')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
      description TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS compliance_controls (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      framework TEXT NOT NULL CHECK (framework IN ('SOX', 'GDPR', 'DPDP', 'SAP_BASELINE')),
      control_id TEXT NOT NULL,
      control_name TEXT NOT NULL,
      control_description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'not_assessed' CHECK (status IN ('compliant', 'non_compliant', 'partial', 'not_assessed')),
      evidence TEXT,
      last_assessed DATETIME,
      assigned_to TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS behavioral_alerts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      user_id TEXT,
      user_name TEXT NOT NULL,
      alert_type TEXT NOT NULL CHECK (alert_type IN ('mass_data_export', 'off_hours_access', 'privilege_escalation', 'unusual_tcode', 'transport_anomaly')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
      source_system TEXT NOT NULL,
      activity TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'cleared', 'escalated')),
      occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS agent_ledger (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_object TEXT NOT NULL,
      action_summary TEXT NOT NULL,
      data_accessed TEXT,
      outcome TEXT NOT NULL CHECK (outcome IN ('success', 'partial', 'failed', 'blocked')),
      risk_level TEXT NOT NULL CHECK (risk_level IN ('none', 'low', 'medium', 'high')),
      user_id TEXT,
      hash TEXT NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS agr_users (
      id TEXT PRIMARY KEY,
      detection_run_id TEXT NOT NULL,
      uname TEXT NOT NULL,
      user_full_name TEXT,
      user_type TEXT,
      locked_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(detection_run_id) REFERENCES sod_detection_runs(id)
    );

    CREATE TABLE IF NOT EXISTS agr_1251 (
      id TEXT PRIMARY KEY,
      detection_run_id TEXT NOT NULL,
      role_name TEXT NOT NULL,
      tcode TEXT NOT NULL,
      tcode_description TEXT,
      auth_object TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(detection_run_id) REFERENCES sod_detection_runs(id)
    );

    CREATE TABLE IF NOT EXISTS sod_rules (
      id TEXT PRIMARY KEY,
      rule_name TEXT NOT NULL UNIQUE,
      tcode_1 TEXT NOT NULL,
      tcode_2 TEXT NOT NULL,
      tcode_1_description TEXT,
      tcode_2_description TEXT,
      conflict_description TEXT NOT NULL,
      business_area TEXT,
      regulatory_framework TEXT,
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')) DEFAULT 'high',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sod_detection_runs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      run_name TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      users_count INTEGER DEFAULT 0,
      roles_count INTEGER DEFAULT 0,
      tcodes_count INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS sod_detected_violations (
      id TEXT PRIMARY KEY,
      detection_run_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      violation_type TEXT NOT NULL CHECK (violation_type IN ('user_has_both_tcodes', 'role_has_both_tcodes', 'user_via_multiple_roles')),
      severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
      tcode_1 TEXT NOT NULL,
      tcode_2 TEXT NOT NULL,
      user_name TEXT,
      role_1 TEXT,
      role_2 TEXT,
      affected_user_count INTEGER DEFAULT 1,
      rule_name TEXT,
      description TEXT NOT NULL,
      remediation_suggestion TEXT,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'remediated', 'accepted', 'false_positive')),
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(detection_run_id) REFERENCES sod_detection_runs(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE INDEX IF NOT EXISTS idx_auth_project ON auth_findings(project_id);
    CREATE INDEX IF NOT EXISTS idx_code_project ON code_findings(project_id);
    CREATE INDEX IF NOT EXISTS idx_data_project ON data_findings(project_id);
    CREATE INDEX IF NOT EXISTS idx_tdsl_rules_lookup ON tdsl_pii_rules(table_name, field_name, is_active);
    CREATE INDEX IF NOT EXISTS idx_comp_project ON compliance_controls(project_id);
    CREATE INDEX IF NOT EXISTS idx_behav_project ON behavioral_alerts(project_id);
    CREATE INDEX IF NOT EXISTS idx_agent_project ON agent_ledger(project_id);
    CREATE INDEX IF NOT EXISTS idx_agr_users_run ON agr_users(detection_run_id);
    CREATE INDEX IF NOT EXISTS idx_agr_1251_run ON agr_1251(detection_run_id);
    CREATE INDEX IF NOT EXISTS idx_sod_rules_active ON sod_rules(is_active);
    CREATE INDEX IF NOT EXISTS idx_sod_violations_run ON sod_detected_violations(detection_run_id);
    CREATE INDEX IF NOT EXISTS idx_sod_violations_project ON sod_detected_violations(project_id);
    
    -- VSE: Production vulnerability scan findings
    CREATE TABLE IF NOT EXISTS vse_findings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      scan_type TEXT NOT NULL,
      finding_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      affected_object TEXT NOT NULL,
      system_component TEXT NOT NULL,
      description TEXT NOT NULL,
      technical_detail TEXT NOT NULL,
      remediation TEXT NOT NULL,
      cvss_score REAL,
      status TEXT DEFAULT 'open',
      scan_triggered_by TEXT,
      detected_at INTEGER NOT NULL
    );

    -- VSE: Post-go-live change events
    CREATE TABLE IF NOT EXISTS vse_change_events (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_description TEXT NOT NULL,
      triggered_by TEXT NOT NULL,
      object_name TEXT,
      regression_status TEXT DEFAULT 'pending',
      findings_count INTEGER DEFAULT 0,
      occurred_at INTEGER NOT NULL
    );

    -- VSE: Security Handover Report
    CREATE TABLE IF NOT EXISTS vse_handover_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE,
      generated_at INTEGER NOT NULL,
      generated_by TEXT NOT NULL,
      final_security_score INTEGER NOT NULL,
      pre_golive_findings_total INTEGER NOT NULL,
      pre_golive_findings_remediated INTEGER NOT NULL,
      pre_golive_findings_accepted INTEGER NOT NULL,
      post_golive_findings_total INTEGER NOT NULL,
      post_golive_findings_open INTEGER NOT NULL,
      regression_checks_run INTEGER NOT NULL,
      regression_issues_found INTEGER NOT NULL,
      baseline_snapshot TEXT NOT NULL,
      open_risk_items TEXT,
      ai_narrative TEXT,
      report_status TEXT DEFAULT 'draft',
      ciso_signed_off_by TEXT,
      ciso_signed_off_at INTEGER
    );

    -- VSE: Continuous monitoring subscriptions
    CREATE TABLE IF NOT EXISTS vse_monitoring (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      check_type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      last_run INTEGER,
      last_result TEXT,
      findings_since_baseline INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );
  `);

  // Initialize with seed data
  seedDatabase(db);
  
  return db;
}

// Seed data initialization
function seedDatabase(db: MockDatabase): void {
  function hashPassword(password: string): string {
    return bcryptjs.hashSync(password, 10);
  }

  function generateHash(obj: any): string {
    return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }

  function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomRange(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const projectId = uuidv4();

  // Seed Project
  db.prepare(`INSERT INTO projects (id, name, client, migration_type, source_system, target_system, phase, overall_risk_score, compliance_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
    projectId, 'GlobalCorp S/4HANA Migration 2025', 'GlobalCorp International',
    'brownfield', 'SAP ECC 6.0 EhP7', 'SAP S/4HANA 2023', 'realize', 72, 65
  );

  // Seed Users
  const userData = [
    { email: 'ciso@demo.com', name: 'Sarah Mitchell', role: 'ciso' },
    { email: 'pm@demo.com', name: 'James Chen', role: 'project_manager' },
    { email: 'analyst@demo.com', name: 'Elena Rodriguez', role: 'security_analyst' },
    { email: 'auditor@demo.com', name: 'David Kumar', role: 'auditor' }
  ];

  userData.forEach(user => {
    db.prepare(`INSERT INTO users (id, email, name, role, project_id, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), user.email, user.name, user.role, projectId, hashPassword('Shield@2025')
    );
  });

  // Auth Findings (25+)
  const authFindingTypes = ['sod_violation', 'privileged_access', 'orphaned_role', 'critical_auth'];
  const sodConflicts = [
    { tcode_1: 'FB60', tcode_2: 'F110', desc: 'AP invoice entry + payment run' },
    { tcode_1: 'ME21N', tcode_2: 'MIRO', desc: 'PO create + invoice verify' },
    { tcode_1: 'VA01', tcode_2: 'VF01', desc: 'Sales order + billing' },
    { tcode_1: 'FK01', tcode_2: 'F110', desc: 'Vendor master create + payment' },
  ];

  for (let i = 0; i < 25; i++) {
    const sod = sodConflicts[i % sodConflicts.length];
    db.prepare(`INSERT INTO auth_findings (id, project_id, finding_type, severity, role_name, tcode_1, tcode_2, user_count, description, remediation, status, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, 'sod_violation', randomChoice(['critical', 'high']), 
      `ZDEVELOPER_${i}`, sod.tcode_1, sod.tcode_2, randomRange(2, 8),
      `SoD conflict: ${sod.desc}`, `Recertify role assignment`, 'open', daysAgo(randomRange(0, 30))
    );
  }

  // Code Findings (20+)
  for (let i = 0; i < 20; i++) {
    db.prepare(`INSERT INTO code_findings (id, project_id, object_name, object_type, finding_type, severity, line_number, code_snippet, description, remediation, cvss_score, status, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, `ZPROGRAM_${i}`, randomChoice(['PROG', 'CLAS']),
      randomChoice(['missing_auth_check', 'hardcoded_credential']), randomChoice(['critical', 'high', 'medium']),
      randomRange(100, 500), 'PERFORM check_auth.', `Code vulnerability in ${i}`, 'Add proper authorization check', 
      randomRange(7, 9), 'open', daysAgo(randomRange(0, 20))
    );
  }

  // Data Findings (15+)
  for (let i = 0; i < 15; i++) {
    db.prepare(`INSERT INTO data_findings (id, project_id, dataset_name, table_name, field_name, pii_type, regulation, record_count, masked, description, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, `Dataset_${i}`, `PA${String(i).padStart(2, '0')}`, 'FIELD_NAME',
      randomChoice(['salary', 'national_id', 'bank_account']), randomChoice(['GDPR', 'DPDP']),
      randomRange(1000, 100000), 0, `Unmasked PII in production`, daysAgo(randomRange(0, 15))
    );
  }

  // TDSL PII Classification Rules (200+ SAP table/field rules)
  const piiFieldRules = [
    { field: 'PERNR', pii: 'national_id', regulation: 'DPDP', severity: 'high', label: 'Personnel number' },
    { field: 'PERID', pii: 'national_id', regulation: 'DPDP', severity: 'critical', label: 'National identification number' },
    { field: 'ICNUM', pii: 'national_id', regulation: 'DPDP', severity: 'critical', label: 'Identity card number' },
    { field: 'EMAIL', pii: 'email', regulation: 'GDPR', severity: 'medium', label: 'Email address' },
    { field: 'SMTP_ADDR', pii: 'email', regulation: 'GDPR', severity: 'medium', label: 'SMTP email address' },
    { field: 'TEL_NUMBER', pii: 'phone', regulation: 'GDPR', severity: 'medium', label: 'Telephone number' },
    { field: 'MOBILE', pii: 'phone', regulation: 'GDPR', severity: 'medium', label: 'Mobile phone number' },
    { field: 'BANKN', pii: 'bank_account', regulation: 'SOX', severity: 'critical', label: 'Bank account number' },
    { field: 'IBAN', pii: 'bank_account', regulation: 'SOX', severity: 'critical', label: 'IBAN bank account' },
    { field: 'BETRG', pii: 'salary', regulation: 'GDPR', severity: 'high', label: 'Compensation amount' },
    { field: 'ANSAL', pii: 'salary', regulation: 'GDPR', severity: 'high', label: 'Annual salary' },
    { field: 'MED_DATA', pii: 'health_data', regulation: 'HIPAA', severity: 'critical', label: 'Medical or health data' },
  ];

  const piiTables = [
    'PA0001', 'PA0002', 'PA0006', 'PA0008', 'PA0009', 'PA0105', 'PA0185', 'PA2001', 'PA2002', 'PA2006',
    'BUT000', 'BUT020', 'BUT0BK', 'BUT0ID', 'KNA1', 'KNBK', 'LFA1', 'LFBK', 'BSEC', 'ADRC',
    'ADR2', 'ADR6', 'USR21', 'USR02', 'HRP1001', 'HRP1000', 'P0002', 'P0006', 'P0008', 'P0009'
  ];

  piiTables.forEach((tableName) => {
    piiFieldRules.forEach((fieldRule) => {
      const ruleCode = `${tableName}_${fieldRule.field}`;
      db.prepare(`INSERT INTO tdsl_pii_rules (id, rule_code, table_name, field_name, pii_type, regulation, severity, description, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`).run(
        uuidv4(),
        ruleCode,
        tableName,
        fieldRule.field,
        fieldRule.pii,
        fieldRule.regulation,
        fieldRule.severity,
        `${fieldRule.label} detected in SAP ${tableName}.${fieldRule.field}`
      );
    });
  });

  // Compliance Controls (30+)
  const frameworks = ['SOX', 'GDPR', 'DPDP', 'SAP_BASELINE'];
  for (let i = 0; i < 30; i++) {
    db.prepare(`INSERT INTO compliance_controls (id, project_id, framework, control_id, control_name, control_description, status, evidence, last_assessed, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, randomChoice(frameworks), `CTRL_${String(i).padStart(3, '0')}`,
      `Control Name ${i}`, `Description for control ${i}`, randomChoice(['compliant', 'partial', 'non_compliant']),
      'Audit report ref#123', daysAgo(randomRange(0, 60)), 'compliance@corp.com'
    );
  }

  // Behavioral Alerts (20+)
  for (let i = 0; i < 20; i++) {
    db.prepare(`INSERT INTO behavioral_alerts (id, project_id, user_id, user_name, alert_type, severity, source_system, activity, risk_score, details, status, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, `USER_${i}`, `User Name ${i}`,
      randomChoice(['mass_data_export', 'off_hours_access', 'privilege_escalation']), randomChoice(['high', 'medium']),
      'SAP', `Unusual activity detected`, randomRange(40, 90), `Details for alert ${i}`, 'open', daysAgo(randomRange(0, 10))
    );
  }

  // Agent Ledger (30+)
  for (let i = 0; i < 30; i++) {
    const action = { timestamp: daysAgo(randomRange(0, 30)), action: `Action ${i}`, user: `user_${i}` };
    db.prepare(`INSERT INTO agent_ledger (id, project_id, agent_name, action_type, target_object, action_summary, data_accessed, outcome, risk_level, user_id, hash, executed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      uuidv4(), projectId, `Agent_${i % 3}`, randomChoice(['analysis', 'remediation', 'audit']),
      `Object_${i}`, `Summary of action ${i}`, JSON.stringify(action),
      randomChoice(['success', 'partial', 'failed']), randomChoice(['low', 'medium', 'high']),
      `user_${i}`, generateHash(action), daysAgo(randomRange(0, 30))
    );
  }

  // SoD Rules (Standard SAP Rules)
  const sodRules = [
    { rule_name: 'FI_AP_PAYMENT', tcode_1: 'FB60', tcode_2: 'F110', desc: 'Accounts Payable invoice entry cannot coexist with payment run', area: 'Finance', framework: 'SOX', sev: 'critical' },
    { rule_name: 'FI_AR_BILLING', tcode_1: 'FB70', tcode_2: 'F110', desc: 'Accounts Receivable invoice entry cannot coexist with payment run', area: 'Finance', framework: 'SOX', sev: 'critical' },
    { rule_name: 'MM_PO_INVOICE', tcode_1: 'ME21N', tcode_2: 'MIRO', desc: 'PO creation cannot coexist with invoice verification', area: 'Procurement', framework: 'SOX', sev: 'critical' },
    { rule_name: 'MM_GR_INVOICE', tcode_1: 'MIGO', tcode_2: 'MIRO', desc: 'Goods receipt cannot coexist with invoice verification', area: 'Procurement', framework: 'SOX', sev: 'high' },
    { rule_name: 'SD_ORDER_BILLING', tcode_1: 'VA01', tcode_2: 'VF01', desc: 'Sales order creation cannot coexist with billing document creation', area: 'Sales', framework: 'SOX', sev: 'critical' },
    { rule_name: 'FI_VENDOR_PAYMENT', tcode_1: 'FK01', tcode_2: 'F110', desc: 'Vendor master creation cannot coexist with payment run', area: 'Finance', framework: 'SOX', sev: 'high' },
    { rule_name: 'FI_CUSTOMER_PAYMENT', tcode_1: 'FD01', tcode_2: 'F110', desc: 'Customer master creation cannot coexist with payment run', area: 'Finance', framework: 'SOX', sev: 'high' },
    { rule_name: 'MM_PO_APPROVAL', tcode_1: 'ME21N', tcode_2: 'ME29N', desc: 'PO creation cannot coexist with PO approval', area: 'Procurement', framework: 'SAP_BASELINE', sev: 'high' },
  ];

  sodRules.forEach(rule => {
    db.prepare(`INSERT INTO sod_rules (id, rule_name, tcode_1, tcode_2, tcode_1_description, tcode_2_description, conflict_description, business_area, regulatory_framework, severity, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`).run(
      uuidv4(), rule.rule_name, rule.tcode_1, rule.tcode_2, 
      `${rule.tcode_1} description`, `${rule.tcode_2} description`, rule.desc,
      rule.area, rule.framework, rule.sev
    );
  });

  // VSE Seed Data
  const vseFindingTypes = ['open_rfc_destination','default_user_active','debug_access_granted','icf_service_exposed','profile_parameter_misconfiguration','gateway_security_gap'];
  const sampleFindings: any[] = [];
  function addVSE(idSuffix: number, scan_type: string, finding_type: string, severity: string, affected_object: string, component: string, status: string, cvss: number, daysAgoOffset: number) {
    sampleFindings.push({
      id: uuidv4(), projectId, scan_type, finding_type, severity,
      affected_object, system_component: component,
      description: `Detected ${finding_type} on ${affected_object}`,
      technical_detail: `Technical details for ${finding_type}`,
      remediation: `Recommended remediation for ${finding_type}`,
      cvss_score: cvss, status, scan_triggered_by: 'system', detected_at: Date.now() - daysAgoOffset * 24 * 60 * 60 * 1000
    });
  }

  // Create 18 findings (12 production_scan + 6 regression_check)
  addVSE(1, 'production_scan', 'open_rfc_destination', 'critical', 'RFC_DEST: PROD_ERP_TRUST', 'SM59', 'open', 9.6, 5);
  addVSE(2, 'production_scan', 'default_user_active', 'critical', 'USER: EARLYWATCH', 'SU01', 'in_review', 9.2, 20);
  addVSE(3, 'production_scan', 'debug_access_granted', 'high', 'USER: Z_FI_AP_SENIOR', 'S_DEVELOP', 'open', 7.8, 3);
  addVSE(4, 'production_scan', 'icf_service_exposed', 'high', '/sap/bc/soap/rfc', 'SICF', 'remediated', 7.5, 10);
  addVSE(5, 'production_scan', 'profile_parameter_misconfiguration', 'critical', 'auth/no_check_in_some_cases=Y', 'RZ10', 'open', 9.0, 2);
  addVSE(6, 'production_scan', 'gateway_security_gap', 'critical', 'SMGW: reginfo file missing', 'SMGW', 'open', 9.7, 1);
  addVSE(7, 'production_scan', 'profile_parameter_misconfiguration', 'medium', 'login/password_expiration_time=120', 'RZ10', 'in_review', 5.0, 15);
  addVSE(8, 'production_scan', 'icf_service_exposed', 'low', '/sap/bc/gui/some_test', 'SICF', 'accepted', 3.5, 30);
  addVSE(9, 'production_scan', 'default_user_active', 'high', 'USER: DDIC', 'SU01', 'open', 7.9, 7);
  addVSE(10, 'production_scan', 'open_rfc_destination', 'high', 'RFC_DEST: LEGACY_LINK', 'SM59', 'remediated', 7.4, 12);
  addVSE(11, 'production_scan', 'debug_access_granted', 'medium', 'USER: Z_CONSULTANT_01', 'S_DEVELOP', 'open', 4.8, 6);
  addVSE(12, 'production_scan', 'gateway_security_gap', 'high', 'SMGW: reginfo permissive', 'SMGW', 'in_review', 7.2, 4);

  // Regression checks (6)
  addVSE(13, 'regression_check', 'debug_access_granted', 'high', 'USER: Z_FAST_CHANGE', 'S_DEVELOP', 'open', 8.0, 1);
  addVSE(14, 'regression_check', 'open_rfc_destination', 'medium', 'RFC_DEST: TEMP_CONN', 'SM59', 'pending', 5.5, 2);
  addVSE(15, 'regression_check', 'profile_parameter_misconfiguration', 'medium', 'login/fails_to_user_lock=10', 'RZ10', 'open', 5.2, 3);
  addVSE(16, 'regression_check', 'icf_service_exposed', 'high', '/sap/bc/soap/newsvc', 'SICF', 'findings_detected', 7.6, 2);
  addVSE(17, 'regression_check', 'default_user_active', 'low', 'USER: SAPCPIC', 'SU01', 'clean', 3.8, 8);
  addVSE(18, 'regression_check', 'gateway_security_gap', 'high', 'SMGW: reginfo exists but permissive', 'SMGW', 'findings_detected', 7.7, 5);

  sampleFindings.forEach(f => {
    db.prepare(`INSERT INTO vse_findings (id, project_id, scan_type, finding_type, severity, affected_object, system_component, description, technical_detail, remediation, cvss_score, status, scan_triggered_by, detected_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(f.id, projectId, f.scan_type, f.finding_type, f.severity, f.affected_object, f.system_component, f.description, f.technical_detail, f.remediation, f.cvss_score, f.status, f.scan_triggered_by, f.detected_at);
  });

  // VSE change events (10 rows)
  const vseEvents: any[] = [];
  function addEvent(type: string, desc: string, triggered_by: string, object_name: string, status: string, days: number, findings_count: number) {
    vseEvents.push({ id: uuidv4(), projectId, event_type: type, event_description: desc, triggered_by, object_name, regression_status: status, findings_count, occurred_at: Date.now() - days * 24 * 60 * 60 * 1000 });
  }

  addEvent('transport_deployed', 'ZFI_AP_INVOICE_FIX transport K900123 deployed to PRD', 'deploy_bot', 'ZFI_AP_INVOICE_FIX', 'findings_detected', 3, 2);
  addEvent('role_modified', 'Role ZPROC_PURCHASE updated by admin', 'admin_user', 'ZPROC_PURCHASE', 'clean', 7, 0);
  addEvent('user_batch_created', 'Batch create users for payroll run', 'hr_sync', 'BATCH_PAYROLL_0426', 'findings_detected', 10, 1);
  addEvent('parameter_changed', 'Changed rfc/reject_expired_passwd to 0', 'ops_engineer', 'rfc/reject_expired_passwd', 'findings_detected', 2, 1);
  addEvent('transport_deployed', 'ZDEV_TOOLS transport K900999 deployed', 'deploy_bot', 'ZDEV_TOOLS', 'pending', 1, 0);
  addEvent('role_modified', 'ZDEV_ASSIGN role change', 'admin_user', 'ZDEV_ASSIGN', 'pending', 4, 0);
  addEvent('user_batch_created', 'Imported user batch from partner', 'partner_sync', 'PARTNER_USERS_01', 'clean', 12, 0);
  addEvent('parameter_changed', 'login/password_expiration_time changed to 120', 'ops_engineer', 'login/password_expiration_time', 'clean', 9, 0);
  addEvent('transport_deployed', 'Hotfix transport K901111', 'deploy_bot', 'HOTFIX_111', 'findings_detected', 5, 2);
  addEvent('role_modified', 'Segregation role updated ZSEG_CTRL', 'role_owner', 'ZSEG_CTRL', 'pending', 6, 0);

  vseEvents.forEach(e => {
    db.prepare(`INSERT INTO vse_change_events (id, project_id, event_type, event_description, triggered_by, object_name, regression_status, findings_count, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(e.id, projectId, e.event_type, e.event_description, e.triggered_by, e.object_name, e.regression_status, e.findings_count, e.occurred_at);
  });

  // VSE handover report (1 row)
  const baseline = JSON.stringify({ golive_date: daysAgo(30), system_id: 'S4HPRD', client: '100', s4hana_version: '2023', total_users: 1200, total_roles: 320, total_z_programs: 450, parameter_snapshot: { 'rfc/reject_expired_passwd': '1' } }, null, 2);
  db.prepare(`INSERT INTO vse_handover_reports (id, project_id, generated_at, generated_by, final_security_score, pre_golive_findings_total, pre_golive_findings_remediated, pre_golive_findings_accepted, post_golive_findings_total, post_golive_findings_open, regression_checks_run, regression_issues_found, baseline_snapshot, open_risk_items, ai_narrative, report_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(uuidv4(), projectId, Date.now(), 'automated_vse', 87, 85, 71, 8, 18, 12, 10, 4, baseline, '[]', `Executive summary:\n\nThe transformation achieved a strong security posture at go-live with most critical issues remediated. Post-go-live scanning identified a small set of high-priority configuration and access issues that require business-owner sign-off.\n\nKey risks addressed include open RFC destinations and default system users; remediation steps included tightening RFC destination filters and enforcing password policies. Regression checks detected 4 reintroductions requiring follow-up.\n\nGoing forward, recommended controls include continuous monitoring, weekly parameter drift checks, and enforced role recertification.`, 'ciso_review');

  // VSE monitoring (4 rows)
  const monitors = [
    { check_type: 'sod_regression', frequency: 'on_change' },
    { check_type: 'code_security_regression', frequency: 'on_change' },
    { check_type: 'parameter_drift', frequency: 'daily' },
    { check_type: 'user_access_drift', frequency: 'weekly' }
  ];
  monitors.forEach(m => {
    db.prepare(`INSERT INTO vse_monitoring (id, project_id, check_type, frequency, last_run, last_result, findings_since_baseline, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(uuidv4(), projectId, m.check_type, m.frequency, Date.now() - 2 * 24 * 60 * 60 * 1000, 'clean', 0, 1);
  });
}
