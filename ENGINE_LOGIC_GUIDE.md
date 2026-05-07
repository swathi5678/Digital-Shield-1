# Digital Shield Engine Logic Guide

This document explains how each Digital Shield engine works in the current codebase, where the logic lives, and how the detection flow is implemented or represented today.

Important implementation note: the MVP now has runtime logic for each engine, with different depths of implementation:

- **Detection/assessment engines** that create findings from uploaded data or runtime inputs, such as SoD, TDSL, SCG, CPM, BAS, and AGL.
- **Posture/scoring engines** that compute summaries from stored findings, such as VSE and dashboard scoring.
- **Seeded demo data** still exists so the app has content immediately after startup.

Some engines are still lightweight rule-based implementations rather than full SAP connector integrations. The runtime paths are real, but production SAP extraction/connectors remain the next hardening phase.

## Architecture Flow

```text
React page
  -> API route in server/src/routes/*
  -> service logic in server/src/services/* or SQL query in route
  -> SQLite-like in-memory database from server/src/db/schema.ts
  -> findings returned to UI
  -> optional AI narrative through server/src/services/openai.service.ts
```

Core locations:

- API routes: `server/src/routes`
- Business logic services: `server/src/services`
- Database schema and demo seed data: `server/src/db/schema.ts`
- Shared backend types: `server/src/types/index.ts`
- Frontend pages: `client/src/pages`

## 1. TDSL: Test Data Sovereignty Layer

Purpose: detect PII exposure in non-production SAP datasets and track whether sensitive fields are masked.

Current implementation:

- Findings are stored in `data_findings`.
- Demo records are seeded in `server/src/db/schema.ts` and `server/src/db/seed.ts`.
- API filtering and masking live in `server/src/routes/tdsl.routes.ts`.
- Runtime scanning lives in `server/src/services/tdsl.service.ts`.
- The SAP table/field rule catalog is stored in the `tdsl_pii_rules` table and seeded with 360 active classification rules.
- Upload scanning is exposed at `POST /api/projects/:id/data-scan/upload`.

### Current Data Model

Defined in `server/src/db/schema.ts`:

```sql
CREATE TABLE IF NOT EXISTS data_findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  table_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  pii_type TEXT NOT NULL CHECK (pii_type IN ('salary', 'national_id', 'bank_account', 'health_data', 'email', 'phone')),
  regulation TEXT NOT NULL CHECK (regulation IN ('GDPR', 'DPDP', 'HIPAA', 'SOX')),
  record_count INTEGER NOT NULL,
  masked BOOLEAN DEFAULT 0,
  description TEXT,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Step 1: Detection

Current behavior: detection can come from seeded `data_findings` rows or from runtime dataset scans.

Where:

- Seed insertion: `server/src/db/schema.ts`
- Read API: `server/src/routes/tdsl.routes.ts`
- Scan API: `POST /api/projects/:id/data-scan/upload`
- Scanner service: `server/src/services/tdsl.service.ts`

Current route logic:

```ts
let query = 'SELECT * FROM data_findings WHERE project_id = ?';
const params: any[] = [id];

if (regulation && regulation !== '') {
  query += ' AND regulation = ?';
  params.push(regulation);
}

if (pii_type && pii_type !== '') {
  query += ' AND pii_type = ?';
  params.push(pii_type);
}

if (masked !== undefined && masked !== '') {
  query += ' AND masked = ?';
  params.push(masked === 'true' ? 1 : 0);
}

query += ' ORDER BY detected_at DESC';
const findings = db.prepare(query).all(...params);
```

Runtime scanner shape:

```ts
type PiiRule = {
  table: string;
  field: string;
  pii_type: 'salary' | 'national_id' | 'bank_account' | 'health_data' | 'email' | 'phone';
  regulation: 'GDPR' | 'DPDP' | 'HIPAA' | 'SOX';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
};

const sapPiiRules: PiiRule[] = [
  {
    table: 'PA0008',
    field: 'BETRG',
    pii_type: 'salary',
    regulation: 'GDPR',
    severity: 'high',
    description: 'Employee salary amount in SAP HR basic pay'
  },
  {
    table: 'PA0002',
    field: 'PERID',
    pii_type: 'national_id',
    regulation: 'DPDP',
    severity: 'critical',
    description: 'Government identifier for employee master data'
  }
];

function scanDataset(projectId: string, datasetName: string, columns: string[], rowCount: number) {
  return sapPiiRules
    .filter((rule) => columns.includes(`${rule.table}.${rule.field}`))
    .map((rule) => ({
      project_id: projectId,
      dataset_name: datasetName,
      table_name: rule.table,
      field_name: rule.field,
      pii_type: rule.pii_type,
      regulation: rule.regulation,
      record_count: rowCount,
      masked: false,
      description: rule.description
    }));
}
```

How this answers "Scans dataset against 200+ SAP table/field PII classification rules":

- **Where rules live:** `tdsl_pii_rules`, seeded in `server/src/db/schema.ts`.
- **Where scan runs:** `POST /api/projects/:id/data-scan/upload` in `server/src/routes/tdsl.routes.ts`.
- **Where matching logic lives:** `server/src/services/tdsl.service.ts`.
- **Where results are saved:** `data_findings`.
- **How matching works:** uploaded CSV headers or metadata columns are normalized, compared to SAP metadata keys like `PA0008.BETRG`, then inserted as one finding per matched sensitive field.

### Step 2: Masking

Current route:

```ts
db.prepare('UPDATE data_findings SET masked = 1 WHERE id = ? AND project_id = ?').run(did, id);
const finding = db.prepare('SELECT * FROM data_findings WHERE id = ?').get(did);
res.json(finding);
```

This marks a finding as masked. It does not transform real dataset values yet.

## 2. AIE: Authorization Intelligence Engine

Purpose: detect SAP authorization and Segregation of Duties risks.

Current implementation has two flows:

- Existing `auth_findings` are query-backed demo findings.
- Uploaded SAP AGR CSVs are analyzed by `SoDDetectionService`.

Main files:

- Route: `server/src/routes/aie.routes.ts`
- Service: `server/src/services/sod.service.ts`
- Sample CSV generators: `client/src/utils/sod-sample-data.ts`
- SoD rule seed: `server/src/db/schema.ts`

### Step 1: Upload SAP AGR Data

Route:

```ts
router.post(
  '/projects/:id/sod/upload',
  verifyAuth,
  requireRole('ciso', 'security_analyst', 'project_manager'),
  upload.fields([
    { name: 'agr_users', maxCount: 1 },
    { name: 'agr_1251', maxCount: 1 }
  ]),
  ...
);
```

Expected CSVs:

- `AGR_USERS`: users.
- `AGR_1251`: role-to-transaction-code mappings.

Sample `AGR_1251` row:

```csv
"role_name","tcode","tcode_description","auth_object"
"ZFINANCE_BP","FB60","Enter Incoming Invoices","F_BKPF_FI"
"ZFINANCE_BP","F110","Outgoing Payments - Post","F_BKPF_FI"
```

### Step 2: Parse CSV

Where: `server/src/routes/aie.routes.ts`

```ts
const tcodesData = parse(agr1251File.buffer.toString(), {
  columns: true,
  skip_empty_lines: true,
  trim: true
});

agr1251 = tcodesData.map((row: any) => ({
  role_name: row.role_name || row.ROLE_NAME || row.AGRName,
  tcode: row.tcode || row.TCODE || row.TCode,
  tcode_description: row.tcode_description || row.TCODE_DESCRIPTION,
  auth_object: row.auth_object || row.AUTH_OBJECT
}));
```

### Step 3: Store Detection Run

Where: `SoDDetectionService.createDetectionRun`

```ts
this.db.prepare(
  `INSERT INTO sod_detection_runs (id, project_id, run_name, users_count, roles_count, tcodes_count, status)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(
  runId,
  projectId,
  runName,
  agrUsers.length,
  new Set(agrTcodes.map(t => t.role_name)).size,
  new Set(agrTcodes.map(t => t.tcode)).size,
  'completed'
);
```

### Step 4: Build Role and User Access Maps

Where: `SoDDetectionService.runDetection`

```ts
const roleToTcodes = new Map<string, Set<string>>();
const userToTcodes = new Map<string, Set<string>>();

agrTcodes.forEach((entry: any) => {
  if (!roleToTcodes.has(entry.role_name)) {
    roleToTcodes.set(entry.role_name, new Set());
  }
  roleToTcodes.get(entry.role_name)!.add(entry.tcode);
});

const userRoleMap = this.simulateUserRoleAssignments(agrUsers, agrTcodes);

userRoleMap.forEach((roles, userName) => {
  const tcodes = new Set<string>();
  roles.forEach(role => {
    const roleTcodes = roleToTcodes.get(role) || new Set();
    roleTcodes.forEach(tcode => tcodes.add(tcode));
  });
  userToTcodes.set(userName, tcodes);
});
```

Note: real SAP production integration should replace `simulateUserRoleAssignments` with actual user-role assignments from AGR_USERS/AGR_AGRS or equivalent extracted data.

### Step 5: Apply SoD Rules

Where: `sod_rules` table and `SoDDetectionService.runDetection`.

The engine checks each active rule in three ways:

1. User has both conflicting TCodes through assigned access.
2. A single role contains both conflicting TCodes.
3. A user receives the conflicting TCodes through multiple roles.

Sample rule check:

```ts
rules.forEach((rule: any) => {
  const tcode1 = rule.tcode_1;
  const tcode2 = rule.tcode_2;

  userToTcodes.forEach((tcodes, userName) => {
    if (tcodes.has(tcode1) && tcodes.has(tcode2)) {
      violations.push({
        id: uuidv4(),
        violation_type: 'user_has_both_tcodes',
        severity: rule.severity,
        tcode_1: tcode1,
        tcode_2: tcode2,
        user_name: userName,
        affected_user_count: 1,
        rule_name: rule.rule_name,
        description: `User ${userName} has both ${tcode1} and ${tcode2}: ${rule.conflict_description}`,
        remediation_suggestion: `Remove access to either ${tcode1} or ${tcode2} from user ${userName}`
      });
    }
  });
});
```

### Step 6: Persist Violations

Where: `sod_detected_violations`.

```ts
this.db.prepare(
  `INSERT INTO sod_detected_violations
   (id, detection_run_id, project_id, violation_type, severity, tcode_1, tcode_2, user_name, role_1, role_2, affected_user_count, rule_name, description, remediation_suggestion, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
).run(...);
```

## 3. SCG: Secure Code Guardian

Purpose: surface ABAP security risks such as missing authorization checks, hardcoded credentials, SQL injection, RFC abuse, and open cursors.

Current implementation:

- Findings are seeded in `code_findings` for demo startup data.
- Runtime ABAP scanning is implemented in `server/src/services/scg.service.ts`.
- Upload scanning is exposed at `POST /api/projects/:id/code-scan/upload`.
- API filters findings by severity, object type, finding type, and status.

Main files:

- Route: `server/src/routes/scg.routes.ts`
- Service: `server/src/services/scg.service.ts`
- Schema: `server/src/db/schema.ts`
- Types: `server/src/types/index.ts`

Current query:

```ts
let query = 'SELECT * FROM code_findings WHERE project_id = ?';

if (severity && severity !== '') {
  query += ' AND severity = ?';
  params.push(severity);
}

if (object_type && object_type !== '') {
  query += ' AND object_type = ?';
  params.push(object_type);
}

if (finding_type && finding_type !== '') {
  query += ' AND finding_type = ?';
  params.push(finding_type);
}
```

Runtime scanner shape:

```ts
const abapRules = [
  {
    id: 'missing_auth_check',
    pattern: /SELECT\s+.*\s+FROM\s+(BKPF|BSEG|PA0008)/i,
    requiresNearbyPattern: /AUTHORITY-CHECK/i,
    severity: 'critical'
  },
  {
    id: 'hardcoded_credential',
    pattern: /(PASSWORD|PASSWD|PWD)\s*=\s*'[^']+'/i,
    severity: 'high'
  }
];

function scanAbapObject(projectId: string, objectName: string, source: string) {
  return abapRules
    .filter((rule) => rule.pattern.test(source))
    .map((rule) => ({
      project_id: projectId,
      object_name: objectName,
      object_type: 'PROG',
      finding_type: rule.id,
      severity: rule.severity,
      code_snippet: source.slice(0, 500),
      status: 'open'
    }));
}
```

Implemented rule categories:

- Missing authorization check before sensitive table access.
- Hardcoded credential-like values.
- Dynamic SQL injection risk.
- RFC call without nearby authorization check.
- Open cursor without explicit close.

## 4. CPM: Compliance Posture Mapper

Purpose: track framework controls and audit posture across SOX, GDPR, DPDP, and SAP baseline controls.

Current implementation:

- Controls are seeded into `compliance_controls` for demo startup data.
- Runtime assessment is implemented in `server/src/services/cpm.service.ts`.
- Automated assessment is exposed at `POST /api/projects/:id/compliance/assess`.
- API returns controls and allows authorized users to update status and evidence.

Main files:

- Route: `server/src/routes/cpm.routes.ts`
- Service: `server/src/services/cpm.service.ts`
- Schema: `server/src/db/schema.ts`

Fetch controls:

```ts
let query = 'SELECT * FROM compliance_controls WHERE project_id = ?';

if (framework && framework !== '') {
  query += ' AND framework = ?';
  params.push(framework);
}

query += ' ORDER BY framework, control_id';
```

Update control evidence:

```ts
const updates = ['status = ?'];
const values: any[] = [status];

if (evidence) {
  updates.push('evidence = ?');
  values.push(evidence);
}

updates.push('last_assessed = datetime("now")');
db.prepare(`UPDATE compliance_controls SET ${updates.join(', ')} WHERE id = ? AND project_id = ?`).run(...values);
```

Runtime assessment logic:

- Counts open authorization findings for SOX posture.
- Counts unmasked PII findings for GDPR and DPDP posture.
- Counts open code findings, behavioral alerts, and critical VSE findings for SAP baseline posture.
- Inserts generated control assessment rows into `compliance_controls`.

## 5. BAS: Behavioral Anomaly Sentinel

Purpose: surface suspicious SAP user activity such as mass exports, off-hours access, privilege escalation, unusual TCodes, and transport anomalies.

Current implementation:

- Alerts are seeded into `behavioral_alerts` for demo startup data.
- Runtime behavioral event ingestion is implemented in `server/src/services/bas.service.ts`.
- Event ingestion is exposed at `POST /api/projects/:id/behavioral-events/ingest`.
- API filters alerts and updates investigation status.

Main files:

- Route: `server/src/routes/bas.routes.ts`
- Service: `server/src/services/bas.service.ts`
- Schema: `server/src/db/schema.ts`

Current alert filter:

```ts
let query = 'SELECT * FROM behavioral_alerts WHERE project_id = ?';

if (severity && severity !== '') {
  query += ' AND severity = ?';
  params.push(severity);
}

if (alert_type && alert_type !== '') {
  query += ' AND alert_type = ?';
  params.push(alert_type);
}

if (status && status !== '') {
  query += ' AND status = ?';
  params.push(status);
}
```

Runtime anomaly shape:

```ts
function scoreActivity(event: { hour: number; exportGb: number; roleChanges: number }) {
  let score = 0;
  if (event.hour < 6 || event.hour > 22) score += 25;
  if (event.exportGb > 10) score += 35;
  if (event.roleChanges > 0) score += 30;

  return {
    risk_score: Math.min(score, 100),
    severity: score >= 75 ? 'critical' : score >= 50 ? 'high' : 'medium'
  };
}
```

Implemented signal scoring:

- Off-hours activity.
- Large data export volume.
- Role changes / privilege escalation.
- Sensitive TCodes such as `SE38`, `SA38`, `SE37`, `SM59`, `SU01`, `PFCG`, and `SE16N`.
- Transport activity.

## 6. AGL: Agent Governance Ledger

Purpose: provide an audit trail for AI/security agent actions.

Current implementation:

- Agent entries are seeded in `agent_ledger` for demo startup data.
- Runtime append-only logging is implemented in `server/src/services/agl.service.ts`.
- Manual/runtime append is exposed at `POST /api/projects/:id/agent-ledger`.
- SCG, CPM, and BAS runtime actions also write ledger entries.
- API filters by agent name, risk level, and date range.
- Export endpoint returns all ledger rows as JSON.

Main files:

- Route: `server/src/routes/agl.routes.ts`
- Service: `server/src/services/agl.service.ts`
- Schema and seed hash generation: `server/src/db/schema.ts`

Current query:

```ts
let query = 'SELECT * FROM agent_ledger WHERE project_id = ?';

if (agent_name && agent_name !== '') {
  query += ' AND agent_name = ?';
  params.push(agent_name);
}

if (risk_level && risk_level !== '') {
  query += ' AND risk_level = ?';
  params.push(risk_level);
}
```

Production ledger append shape:

```ts
function appendAgentAction(action: AgentLedgerEntryInput) {
  const hash = createHash('sha256')
    .update(JSON.stringify(action))
    .digest('hex');

  db.prepare(`
    INSERT INTO agent_ledger
    (id, project_id, agent_name, action_type, target_object, action_summary, data_accessed, outcome, risk_level, user_id, hash, executed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), action.project_id, action.agent_name, action.action_type, action.target_object, action.summary, action.data_accessed, action.outcome, action.risk_level, action.user_id, hash, new Date().toISOString());
}
```

## 7. VSE: Vulnerability Surface Engine

Purpose: track production and regression security exposure after go-live.

Main files:

- Service: `server/src/services/vse.service.ts`
- Route: `server/src/routes/vse.routes.ts`
- Types: `server/src/types/index.ts`
- Seed findings: `server/src/db/schema.ts`

Finding categories:

- `open_rfc_destination`
- `default_user_active`
- `debug_access_granted`
- `icf_service_exposed`
- `profile_parameter_misconfiguration`
- `gateway_security_gap`

### Step 1: Summarize Findings

Where: `VSEService.getVSESummary`

```ts
const total = this.db.prepare('SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ?').get(projectId)?.c || 0;
const critical = this.db.prepare("SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND severity = 'critical' AND status = 'open'").get(projectId)?.c || 0;
const post_golive_total = this.db.prepare('SELECT COUNT(*) as c FROM vse_findings WHERE project_id = ? AND scan_type = ?').get(projectId, 'production_scan')?.c || 0;
const risk = this.computeVSERiskScore(projectId);
```

### Step 2: Calculate VSE Risk Score

Where: `VSEService.computeVSERiskScore`

```ts
let score = 100;
score -= critical * 15;
score -= high * 8;
score -= medium * 4;
score -= low * 2;
if (score < 0) score = 0;
return score;
```

Meaning:

- Starts at 100.
- Critical open findings reduce score by 15 each.
- High reduce by 8 each.
- Medium reduce by 4 each.
- Low reduce by 2 each.

### Step 3: Filter Findings

Where: `VSEService.getVSEFindings`

```ts
let query = 'SELECT * FROM vse_findings WHERE project_id = ?';

if (filters.scan_type) {
  query += ' AND scan_type = ?';
  params.push(filters.scan_type);
}

if (filters.finding_type) {
  query += ' AND finding_type = ?';
  params.push(filters.finding_type);
}

if (filters.search) {
  query += ' AND (affected_object LIKE ? OR description LIKE ? OR technical_detail LIKE ?)';
  params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
}
```

### Step 4: Trigger Simplified Scan

Where: `VSEService.triggerScan`

Current scan is simplified: it creates a medium profile-parameter finding.

```ts
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
};
```

## 8. AI Analysis Layer

Purpose: turn findings into executive summaries, remediation plans, audit narratives, and handover narratives.

Main files:

- Route: `server/src/routes/ai.routes.ts`
- Service: `server/src/services/openai.service.ts`
- Hook: `client/src/hooks/useAIAnalysis.ts`

Supported modes:

- `ciso_brief`
- `remediation_plan`
- `code_fix`
- `data_risk`
- `audit_evidence`
- `behavioral_risk`
- `explain_agent_action`
- `handover_narrative`

Prompt routing:

```ts
function buildPrompts(mode: AnalysisMode, context: unknown): AnalysisPrompts {
  const contextStr = JSON.stringify(context, null, 2);

  switch (mode) {
    case 'data_risk':
      return {
        systemPrompt: 'You are a data privacy officer specialising in SAP landscapes. Reference specific GDPR articles and DPDP provisions where relevant.',
        userPrompt: `Summarise the PII exposure risk from the provided test dataset findings. Identify the highest-risk fields, applicable regulations, and immediate masking priorities.\n\n${contextStr}`,
        useComplexModel: false
      };
  }
}
```

AI call:

```ts
const response = await client.chat.completions.create({
  model,
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  max_completion_tokens: 1500
});
```

## Implemented TDSL Runtime Scanner

The "200+ SAP table/field PII classification rules" path is now implemented in runtime code:

1. `server/src/services/tdsl.service.ts` scans dataset headers and metadata.
2. `tdsl_pii_rules` stores the rule catalog, seeded with 360 SAP table/field rules.
3. `POST /api/projects/:id/data-scan/upload` accepts either a CSV upload or metadata headers.
4. Uploaded CSV headers are parsed with `csv-parse`.
5. Headers are matched against SAP table/field rules.
6. Matches are inserted into `data_findings`.
7. Existing `GET /data-findings` and `PATCH /mask` APIs continue to handle review and remediation.

Minimal service skeleton:

```ts
export class TDSLService {
  constructor(private db: MockDatabase, private rules: PiiRule[]) {}

  scan(projectId: string, datasetName: string, columns: string[], recordCount: number) {
    const findings = this.rules.filter((rule) =>
      columns.some((column) => column.toUpperCase() === `${rule.table}.${rule.field}`.toUpperCase())
    );

    findings.forEach((rule) => {
      this.db.prepare(`
        INSERT INTO data_findings
        (id, project_id, dataset_name, table_name, field_name, pii_type, regulation, record_count, masked, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(uuidv4(), projectId, datasetName, rule.table, rule.field, rule.pii_type, rule.regulation, recordCount, rule.description);
    });

    return findings;
  }
}
```
