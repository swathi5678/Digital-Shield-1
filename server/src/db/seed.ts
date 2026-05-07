import { v4 as uuidv4 } from 'uuid';
import bcryptjs from 'bcryptjs';
import { createHash } from 'crypto';
import { initializeDatabase } from './schema.js';

const db = initializeDatabase();

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
const projectData = {
  id: projectId,
  name: 'GlobalCorp S/4HANA Migration 2025',
  client: 'GlobalCorp International',
  migration_type: 'brownfield',
  source_system: 'SAP ECC 6.0 EhP7',
  target_system: 'SAP S/4HANA 2023',
  phase: 'realize',
  overall_risk_score: 72,
  compliance_score: 65
};

db.prepare(`
  INSERT INTO projects (id, name, client, migration_type, source_system, target_system, phase, overall_risk_score, compliance_score)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(projectData.id, projectData.name, projectData.client, projectData.migration_type, 
       projectData.source_system, projectData.target_system, projectData.phase, 
       projectData.overall_risk_score, projectData.compliance_score);

// Seed Users
const userData = [
  { email: 'ciso@demo.com', name: 'Sarah Mitchell', role: 'ciso' },
  { email: 'pm@demo.com', name: 'James Chen', role: 'project_manager' },
  { email: 'analyst@demo.com', name: 'Elena Rodriguez', role: 'security_analyst' },
  { email: 'auditor@demo.com', name: 'David Kumar', role: 'auditor' }
];

userData.forEach(user => {
  db.prepare(`
    INSERT INTO users (id, email, name, role, project_id, password_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(uuidv4(), user.email, user.name, user.role, projectId, hashPassword('Shield@2025'));
});

// Seed Auth Findings (25+ rows)
const authFindingTypes = ['sod_violation', 'privileged_access', 'orphaned_role', 'critical_auth'];
const sodConflicts = [
  { tcode_1: 'FB60', tcode_2: 'F110', desc: 'AP invoice entry + payment run' },
  { tcode_1: 'ME21N', tcode_2: 'MIRO', desc: 'PO create + invoice verify' },
  { tcode_1: 'VA01', tcode_2: 'VF01', desc: 'Sales order + billing' },
  { tcode_1: 'FK01', tcode_2: 'F110', desc: 'Vendor master create + payment' },
  { tcode_1: 'SE38', tcode_2: 'SM49', desc: 'ABAP editor + OS command' },
  { tcode_1: 'FB01', tcode_2: 'FB50', desc: 'Posting + manual journal entry' },
  { tcode_1: 'MM01', tcode_2: 'MIRO', desc: 'Material master + invoice verify' },
  { tcode_1: 'FBL3N', tcode_2: 'F110', desc: 'GL line items + payment run' }
];

const roleNames = [
  'Z_FI_AP_FULL', 'Z_MM_BUYER_EXT', 'ZSAP_ALLACCESS', 'Z_SD_BILLING_FULL',
  'Z_FI_ACCOUNTANT', 'Z_MM_MANAGER', 'Z_HR_ADMIN', 'Z_SD_SALESMAN',
  'Z_PD_SUPER', 'Z_CONSOLE_ADMIN', 'ZUNX_S4_ADMIN', 'Z_BASIS_DEV'
];

const severities: Array<'critical' | 'high' | 'medium' | 'low'> = [];
for (let i = 0; i < 6; i++) severities.push('critical');
for (let i = 0; i < 10; i++) severities.push('high');
for (let i = 0; i < 7; i++) severities.push('medium');
for (let i = 0; i < 2; i++) severities.push('low');

let authIdx = 0;
severities.forEach(severity => {
  const conflict = randomChoice(sodConflicts);
  const role = randomChoice(roleNames);
  
  db.prepare(`
    INSERT INTO auth_findings (id, project_id, finding_type, severity, role_name, tcode_1, tcode_2, user_count, description, remediation, status, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), projectId, randomChoice(authFindingTypes), severity, role, 
    conflict.tcode_1, conflict.tcode_2, randomRange(3, 45),
    `SoD violation detected: Users with role ${role} can execute both ${conflict.tcode_1} (${conflict.desc.split('+')[0]}) and ${conflict.tcode_2} (${conflict.desc.split('+')[1]}), creating a potential fraud vector.`,
    `Segregate role ${role} into ${role}_CREATE and ${role}_VERIFY roles. Remove users with conflicting T-code access. Implement dynamic SoD monitoring.`,
    randomChoice(['open', 'in_review', 'remediated']),
    daysAgo(randomRange(0, 30))
  );
  authIdx++;
});

// Seed Code Findings (20+ rows)
const codeObjectNames = [
  'ZFI_AP_POST_INVOICE', 'ZMM_PO_APPROVAL', 'ZHR_PAYROLL_REPORT', 'ZSD_BILLING_BATCH',
  'ZFI_PERIOD_CLOSE', 'ZMM_GOODS_RECEIPT', 'ZFI_AP_RECONCILE', 'ZPAY_CALC',
  'ZVENTOR_MASTER', 'ZCO_ALLOCATION', 'ZINTRASTAT_REPORT', 'ZFI_CONSOLIDATION'
];

const codeObjectTypes = ['PROG', 'FUGR', 'CLAS'];
const codeFindingTypes = ['missing_auth_check', 'hardcoded_credential', 'sql_injection', 'rfc_abuse', 'open_cursor'];

const codeSnippets = [
  `SELECT * FROM mara WHERE matnr = p_matnr_input.
   "Missing input sanitization - SQL injection risk"`,
  `sy-uname = 'BASISADM'.
   "Hardcoded bypass of authorization checks"`,
  `CALL FUNCTION 'RFC_READ_TABLE' STARTING WITH TABLE mara.
   "No AUTHORITY-CHECK before sensitive RFC - data exposure risk"`,
  `OPEN CURSOR FOR SELECT * FROM pa0008 PACKAGE SIZE 1000.
   "No pagination - potential memory/denial of service"`,
  `DATA: lv_password TYPE char20.
   lv_password = 'sap#2024@prod'.
   "Hardcoded credential in source code"`
];

for (let i = 0; i < 20; i++) {
  const severity = i < 6 ? 'critical' : (i < 13 ? 'high' : (i < 17 ? 'medium' : 'low'));
  const cvssScore = severity === 'critical' ? randomRange(90, 98) / 10 : 
                    severity === 'high' ? randomRange(70, 89) / 10 :
                    severity === 'medium' ? randomRange(40, 69) / 10 : randomRange(10, 39) / 10;
  
  db.prepare(`
    INSERT INTO code_findings (id, project_id, object_name, object_type, finding_type, severity, line_number, code_snippet, description, remediation, cvss_score, status, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), projectId, randomChoice(codeObjectNames), randomChoice(codeObjectTypes),
    randomChoice(codeFindingTypes), severity, randomRange(10, 500),
    randomChoice(codeSnippets),
    `${randomChoice(codeFindingTypes)} vulnerability detected in ABAP code. Potential security risk during data processing.`,
    `Add AUTHORITY-CHECK statements. Sanitize all user input. Use parameterized OPEN CURSOR. Remove hardcoded credentials from source.`,
    cvssScore, randomChoice(['open', 'in_review', 'remediated']), daysAgo(randomRange(0, 30))
  );
}

// Seed Data Findings (15+ rows)
const datasetNames = [
  'PA_MASTERDATA_UAT_JUNE25', 'FI_BSEG_REGRESSION_TEST', 'HR_PAYROLL_SIT_ROUND3',
  'SD_CUSTOMER_LOAD_TEST', 'MM_INVENTORY_SNAPSHOT', 'FPGA_TEST_DATASET_Q2'
];

const sassTables = [
  { name: 'PA0008', field: 'ANSAL', piiType: 'salary', desc: 'Annual salary data' },
  { name: 'PA0002', field: 'GBLDT', piiType: 'national_id', desc: 'Birth date and personal ID' },
  { name: 'PA0009', field: 'BANKN', piiType: 'bank_account', desc: 'Bank account numbers' },
  { name: 'BSEG', field: 'BVTYP', piiType: 'bank_account', desc: 'Partner bank details' },
  { name: 'KNA1', field: 'STCD1', piiType: 'national_id', desc: 'Customer tax identification' },
  { name: 'PA0014', field: 'EMAIL', piiType: 'email', desc: 'Employee email addresses' },
  { name: 'PA0105', field: 'ZLTEL', piiType: 'phone', desc: 'Employee phone numbers' },
  { name: 'COEP', field: 'WOVNM', piiType: 'health_data', desc: 'Health insurance info' }
];

const regulations = ['GDPR', 'DPDP', 'HIPAA', 'SOX'];

for (let i = 0; i < 15; i++) {
  const table = randomChoice(sassTables);
  const regulation = randomChoice(regulations);
  
  db.prepare(`
    INSERT INTO data_findings (id, project_id, dataset_name, table_name, field_name, pii_type, regulation, record_count, masked, description, detected_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), projectId, randomChoice(datasetNames), table.name, table.field, table.piiType,
    regulation, randomRange(1000, 500000), randomChoice([0, 1]),
    `PII exposure: ${table.desc} in test dataset. ${table.piiType} data visible in ${table.name}.${table.field}. Non-compliance with ${regulation}.`,
    daysAgo(randomRange(0, 30))
  );
}

// Seed Compliance Controls (30+ rows)
const controlData = [
  // SOX
  { framework: 'SOX', id: 'CC6.1', name: 'Logical Access - User ID Management', status: 'partial' },
  { framework: 'SOX', id: 'CC6.2', name: 'Authorization Provisioning Review', status: 'non_compliant' },
  { framework: 'SOX', id: 'CC6.3', name: 'Access Removal on Termination', status: 'compliant' },
  { framework: 'SOX', id: 'CC7.1', name: 'Anomaly Detection and Alerting', status: 'partial' },
  { framework: 'SOX', id: 'CC7.2', name: 'Incident Response and Investigation', status: 'compliant' },
  { framework: 'SOX', id: 'CC9.1', name: 'Change Management Record Keeping', status: 'partial' },
  { framework: 'SOX', id: 'CC9.2', name: 'Testing and Validation of Changes', status: 'non_compliant' },
  // GDPR
  { framework: 'GDPR', id: 'Art5', name: 'Data Minimization', status: 'partial' },
  { framework: 'GDPR', id: 'Art25', name: 'Privacy by Design', status: 'non_compliant' },
  { framework: 'GDPR', id: 'Art32', name: 'Security of Processing', status: 'partial' },
  { framework: 'GDPR', id: 'Art33', name: 'Breach Notification', status: 'compliant' },
  { framework: 'GDPR', id: 'Art35', name: 'Data Protection Impact Assessments', status: 'compliant' },
  // DPDP
  { framework: 'DPDP', id: 'Section_7', name: 'Purpose Limitation', status: 'not_assessed' },
  { framework: 'DPDP', id: 'Section_8', name: 'Consent Mechanisms', status: 'partial' },
  { framework: 'DPDP', id: 'Section_10', name: 'Data Security', status: 'compliant' },
  // SAP Baseline
  { framework: 'SAP_BASELINE', id: 'PSM_P01', name: 'Password Policy Enforcement', status: 'compliant' },
  { framework: 'SAP_BASELINE', id: 'PSM_P02', name: 'RFC Security', status: 'non_compliant' },
  { framework: 'SAP_BASELINE', id: 'PSM_P03', name: 'SM59 Destination Audit', status: 'partial' },
  { framework: 'SAP_BASELINE', id: 'PSM_P04', name: 'Default User Cleanup', status: 'compliant' }
];

const extendedControls = [
  { framework: 'SOX', id: 'CC4.1', name: 'Segregation of Duties', status: 'partial' },
  { framework: 'SOX', id: 'CC6.4', name: 'Quarterly Access Review', status: 'non_compliant' },
  { framework: 'GDPR', id: 'Art13', name: 'Information to be Provided to Data Subject', status: 'compliant' },
  { framework: 'GDPR', id: 'Art17', name: 'Right to Erasure', status: 'partial' },
  { framework: 'DPDP', id: 'Section_6', name: 'Definitions and Scope', status: 'compliant' },
  { framework: 'DPDP', id: 'Section_12', name: 'Accuracy', status: 'not_assessed' },
  { framework: 'SAP_BASELINE', id: 'SEC_A01', name: 'Dialog User Management', status: 'partial' },
  { framework: 'SAP_BASELINE', id: 'SEC_A02', name: 'System Security Parameters', status: 'compliant' },
  { framework: 'SOX', id: 'CC5.1', name: 'Transactions - Completeness', status: 'compliant' },
  { framework: 'SOX', id: 'CC5.2', name: 'Transactions - Accuracy', status: 'partial' },
  { framework: 'GDPR', id: 'Art6', name: 'Lawfulness of Processing', status: 'compliant' },
  { framework: 'DPDP', id: 'Section_11', name: 'Retention and Deletion', status: 'partial' }
];

[...controlData, ...extendedControls].forEach(control => {
  db.prepare(`
    INSERT INTO compliance_controls (id, project_id, framework, control_id, control_name, control_description, status, last_assessed, assigned_to)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), projectId, control.framework, control.id, control.name,
    `Ensure proper implementation of ${control.name} controls in the S/4HANA environment.`,
    control.status, daysAgo(randomRange(0, 60)), randomChoice(['sarah.mitchell', 'james.chen', 'elena.rodriguez'])
  );
});

// Seed Behavioral Alerts (20+ rows)
const consultantNames = [
  'john.carter', 'priya.nair', 'dmitri.volkov', 'sara.okonkwo', 'lee.wang',
  'carlos.mendez', 'anna.kowalski', 'raj.patel', 'maria.silva', 'yuki.tanaka'
];

const alertTypes = ['mass_data_export', 'off_hours_access', 'privilege_escalation', 'unusual_tcode', 'transport_anomaly'];

for (let i = 0; i < 20; i++) {
  const hour = randomRange(0, 23);
  const isOffHours = hour < 6 || hour > 22;
  const severity = randomRange(1, 100) > 60 ? 'high' : (randomRange(1, 100) > 40 ? 'medium' : 'low');
  
  db.prepare(`
    INSERT INTO behavioral_alerts (id, project_id, user_id, user_name, alert_type, severity, source_system, activity, risk_score, details, status, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuidv4(), projectId, uuidv4(), randomChoice(consultantNames),
    randomChoice(alertTypes), severity, randomChoice(['ECC', 'S/4HANA', 'BW']),
    `Unusual activity detected: ${randomChoice(alertTypes)}`,
    randomRange(40, 95),
    `Activity occurred at ${String(hour).padStart(2, '0')}:${String(randomRange(0, 59)).padStart(2, '0')}. ${isOffHours ? 'Off-hours access detected.' : ''}`,
    randomChoice(['open', 'investigating', 'cleared']),
    daysAgo(randomRange(0, 30))
  );
}

// Seed Agent Ledger (30+ rows)
const agentNames = [
  'ForwardEngineeringAgent', 'TestCaseGenerationAgent', 'ExceptionHandlingAgent',
  'ReverseEngineeringAgent', 'FitToStandardAgent', 'DataValidationAgent', 'ConfigurationAgent'
];

const actionTypes = ['code_analysis', 'config_review', 'security_scan', 'data_migration_prep', 'compliance_check'];
const targetObjects = ['ZFI_AP_POST', 'MIRO', 'FB01', 'SE38', 'SM59', 'RFC_READ_TABLE', 'PA0002'];
const outcomes: Array<'success' | 'partial' | 'failed' | 'blocked'> = ['success', 'partial', 'failed', 'blocked'];
const riskLevels: Array<'none' | 'low' | 'medium' | 'high'> = ['none', 'low', 'medium', 'high'];

for (let i = 0; i < 30; i++) {
  const entry = {
    id: uuidv4(),
    project_id: projectId,
    agent_name: randomChoice(agentNames),
    action_type: randomChoice(actionTypes),
    target_object: randomChoice(targetObjects),
    action_summary: `Automated analysis and configuration for target object.`,
    data_accessed: randomRange(1, 500),
    outcome: randomChoice(outcomes),
    risk_level: randomChoice(riskLevels),
    user_id: uuidv4(),
    executed_at: daysAgo(randomRange(0, 30))
  };

  const hash = generateHash(entry);

  db.prepare(`
    INSERT INTO agent_ledger (id, project_id, agent_name, action_type, target_object, action_summary, data_accessed, outcome, risk_level, user_id, hash, executed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id, entry.project_id, entry.agent_name, entry.action_type, entry.target_object,
    entry.action_summary, String(entry.data_accessed), entry.outcome, entry.risk_level,
    entry.user_id, hash, entry.executed_at
  );
}

console.log('✓ Database seeded successfully with all demo data');
console.log(`✓ Project ID: ${projectId}`);
console.log('✓ Auth findings: 25+');
console.log('✓ Code findings: 20+');
console.log('✓ Data findings: 15+');
console.log('✓ Compliance controls: 30+');
console.log('✓ Behavioral alerts: 20+');
console.log('✓ Agent ledger entries: 30+');

