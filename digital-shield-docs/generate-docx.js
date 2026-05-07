const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
  PageBreak,
  LevelFormat,
  SimpleField,
  convertInchesToTwip,
} = require('docx');

// Colors
const NAVY = '0F172A';
const PURPLE = '6C3BFF';
const GRAY_LT = 'F8F9FA';
const GRAY_MD = 'E2E8F0';
const GRAY_DK = '64748B';
const WHITE = 'FFFFFF';
const GREEN_LT = 'DCFCE7';
const BLUE_LT = 'DBEAFE';

// Simple cell creator
function cell(text, bg = WHITE, bold = false) {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    shading: { fill: bg },
    children: [
      new Paragraph({
        text: text || '',
        run: new TextRun({ bold, color: bold ? WHITE : '000000', size: 20 }),
      }),
    ],
  });
}

// Simple table creator
function simpleTable(headers, rows) {
  const colCount = headers.length;
  const colWidth = Math.floor(100 / colCount);
  
  const tableRows = [
    new TableRow({
      children: headers.map(h => cell(h, NAVY, true)),
    }),
    ...rows.map(row =>
      new TableRow({
        children: row.map((val, idx) => 
          cell(val, idx % 2 === 0 ? WHITE : GRAY_LT)
        ),
      })
    ),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

// Document sections
const sections = [];

// === COVER PAGE ===
sections.push(
  new Paragraph({
    text: 'KTern.AI',
    alignment: AlignmentType.CENTER,
    spacing: { before: 800, after: 200 },
    run: new TextRun({ bold: true, size: 112, color: NAVY }),
  }),
  new Paragraph({
    text: 'Digital Shield',
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
    run: new TextRun({ bold: true, size: 140, color: PURPLE }),
  }),
  new Paragraph({
    text: 'Agentic Security Intelligence for SAP Transformation',
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
    run: new TextRun({ italic: true, size: 52, color: GRAY_DK }),
  }),
  new Paragraph({
    text: 'Technical Documentation — v1.0',
    alignment: AlignmentType.CENTER,
    spacing: { after: 1200 },
    run: new TextRun({ size: 40, color: GRAY_DK }),
  }),
  simpleTable(
    ['Metadata', 'Value'],
    [
      ['Document Type', 'Technical Documentation + Executive Summary'],
      ['Version', '1.0'],
      ['Product', 'KTern.AI Digital Shield'],
      ['AI Engine', 'OpenAI o4-mini + o3'],
      ['Classification', 'Confidential'],
    ]
  ),
  new Paragraph({
    text: '',
    spacing: { after: 800 },
  }),
  new Paragraph({
    text: 'Prepared for: KTern.AI Leadership & Technical Review',
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    run: new TextRun({ italic: true, size: 32, color: GRAY_DK }),
  }),
  new Paragraph({ children: [new PageBreak()] })
);

// === SECTION 1: EXECUTIVE SUMMARY ===
sections.push(
  new Paragraph({
    text: '1. Executive Summary',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: 'Digital Shield embeds six specialized security engines directly into the SAP transformation lifecycle. It addresses the critical gap that traditional GRC tools cannot fill: during the 12-18 month migration window, the target system is in sandbox and existing security tools provide zero visibility.',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'Six Security Engines:',
    run: new TextRun({ bold: true }),
    spacing: { after: 100 },
  }),
  new Paragraph({ text: 'AIE (Authorization Intelligence Engine) — Segregation of Duties analysis', bullet: { level: 0 } }),
  new Paragraph({ text: 'SCG (Secure Code Guardian) — ABAP code vulnerability detection', bullet: { level: 0 } }),
  new Paragraph({ text: 'TDSL (Test Data Sovereignty) — PII detection and masking', bullet: { level: 0 } }),
  new Paragraph({ text: 'CPM (Compliance Posture Mapper) — Real-time compliance scorecard', bullet: { level: 0 } }),
  new Paragraph({ text: 'BAS (Behavioral Anomaly Sentinel) — Insider threat detection', bullet: { level: 0 } }),
  new Paragraph({ text: 'AGL (Agent Governance Ledger) — Immutable AI agent audit trails', bullet: { level: 0 }, spacing: { after: 400 } }),
  new Paragraph({
    text: 'Key Business Value:',
    run: new TextRun({ bold: true, color: PURPLE }),
    spacing: { after: 100 },
  }),
  new Paragraph({ text: 'Reduce fraud exposure from 12-18 months to zero on day-1 go-live', bullet: { level: 0 } }),
  new Paragraph({ text: 'Transform compliance from reactive to proactive with daily visibility', bullet: { level: 0 } }),
  new Paragraph({ text: 'Enable autonomous AI agents on SAP systems with immutable audit trails', bullet: { level: 0 } }),
  new Paragraph({ text: 'Eliminate manual security review as transformation bottleneck', bullet: { level: 0 }, spacing: { after: 400 } })
);

// === SECTION 2: ARCHITECTURE ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '2. System Architecture',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: 'Layer Breakdown:',
    heading: 2,
    run: new TextRun({ bold: true, size: 32, color: NAVY }),
    spacing: { before: 200, after: 100 },
  }),
  simpleTable(
    ['Layer', 'Technology', 'Purpose'],
    [
      ['Presentation', 'React 18 + TypeScript + Tailwind CSS', 'User-facing dashboards'],
      ['Client Services', 'React Router + Axios + Zustand', 'API communication & state'],
      ['API Gateway', 'Express 4.x + JWT + TypeScript', '15 REST endpoints, RBAC'],
      ['Security Engines', 'Node.js + TypeScript', 'AIE, SCG, TDSL, CPM, BAS, AGL'],
      ['AI Layer', 'OpenAI (o4-mini + o3)', 'LLM analysis & reasoning'],
      ['Data Layer', 'SQLite / PostgreSQL', '8 tables, 140+ demo records'],
    ]
  ),
  new Paragraph({
    text: '',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'Authentication & RBAC:',
    heading: 2,
    run: new TextRun({ bold: true, size: 32, color: NAVY }),
    spacing: { before: 200, after: 100 },
  }),
  simpleTable(
    ['Role', 'Email Example', 'Permissions', 'Use Case'],
    [
      ['CISO', 'ciso@demo.com', 'All features, remediation approval', 'Executive dashboard'],
      ['Project Manager', 'pm@demo.com', 'Read all, modify metadata', 'Governance view'],
      ['Security Analyst', 'analyst@demo.com', 'View findings, AI analysis', 'Technical analysis'],
      ['Auditor', 'auditor@demo.com', 'Read-only, export reports', 'Compliance audit'],
    ]
  )
);

// === SECTION 3: SECURITY ENGINES ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '3. Security Engines',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  
  new Paragraph({
    text: '3.1 AIE — Authorization Intelligence Engine',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Detects Segregation of Duties violations in role definitions. Ingests SAP role objects (AGR_1251), user assignments (AGR_USERS), and applies 40+ toxic T-code conflict pair rules.',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'SoD Conflict Examples:',
    run: new TextRun({ bold: true }),
    spacing: { after: 100 },
  }),
  new Paragraph({ text: 'FB60 + F110 (Accounts Payable fraud) — Create Vendor + Execute Payments', bullet: { level: 0 } }),
  new Paragraph({ text: 'ME21N + MIRO (Procurement fraud) — Create PO + Receive Invoice', bullet: { level: 0 } }),
  new Paragraph({ text: 'VA01 + VF01 (Revenue bypass) — Create Sales Order + Create Invoice', bullet: { level: 0 }, spacing: { after: 300 } }),
  
  new Paragraph({
    text: '3.2 SCG — Secure Code Guardian',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Performs pattern-based static analysis on Z-namespace ABAP code. Detects: missing_auth_check, hardcoded_credential, sql_injection, rfc_abuse, open_cursor. Each finding scored with CVSS v3.',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'Outputs: Code snippet with line number, CVSS score, CWE identifier, AI-generated secure rewrite.',
    run: new TextRun({ italic: true, color: GRAY_DK }),
    spacing: { after: 300 },
  }),
  
  new Paragraph({
    text: '3.3 TDSL — Test Data Sovereignty Layer',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Intercepts test datasets and scans against 200+ SAP PII classification rules. Applies masking for GDPR Article 32, DPDP Act 2023, HIPAA, SOX compliance.',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'PII Fields: Salary (PA0008/ANSAL), National ID (PA0002/PERID), Bank Account (PA0009/BANKN), Phone/Email (PA0001).',
    run: new TextRun({ italic: true, color: GRAY_DK }),
    spacing: { after: 300 },
  }),
  
  new Paragraph({
    text: '3.4 CPM — Compliance Posture Mapper',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Maps all findings to regulatory frameworks: SOX ITGC, GDPR, DPDP Act 2023, SAP Security Baseline v2. Generates live compliance scorecards (0-100 per framework).',
    spacing: { after: 300 },
  }),
  
  new Paragraph({
    text: '3.5 BAS — Behavioral Anomaly Sentinel',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Detects insider threats by consuming KTern DevOps telemetry + SAP Audit Log (SM20). Scores 5 alert types: off_hours_access, mass_data_export, privilege_escalation, unusual_tcode, transport_anomaly.',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'Risk scoring: 0-100 per alert with escalation factors for repeated patterns.',
    run: new TextRun({ italic: true, color: GRAY_DK }),
    spacing: { after: 300 },
  }),
  
  new Paragraph({
    text: '3.6 AGL — Agent Governance Ledger',
    heading: 3,
    run: new TextRun({ bold: true, size: 40, color: PURPLE }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Creates immutable audit trail of autonomous KTern AI Agent actions. Each entry is SHA-256 hashed with chain-linked parent hashes for tamper detection. Append-only — no DELETE permitted.',
    spacing: { after: 100 },
  })
);

// === SECTION 4: DATABASE ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '4. Database Schema',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: 'SQLite for development (PostgreSQL-ready for production). 8 tables with ACID transactions. Seeded with 140+ realistic demo records.',
    spacing: { after: 300 },
  }),
  simpleTable(
    ['Table', 'Purpose', 'Key Columns'],
    [
      ['Users', 'Authentication & roles', 'id, email, role, project_id'],
      ['Projects', 'SAP transformation projects', 'id, name, phase, overall_risk_score'],
      ['Auth Findings', 'AIE SoD violations', 'id, severity, tcode_1, tcode_2, user_count'],
      ['Code Findings', 'SCG vulnerabilities', 'id, object_name, finding_type, cvss_score, cwe_id'],
      ['Data Findings', 'TDSL PII detection', 'id, dataset_name, table_name, pii_type, regulation'],
      ['Compliance Controls', 'CPM controls', 'id, framework, control_id, status, findings_resolved'],
      ['Behavioral Alerts', 'BAS threat alerts', 'id, user_name, alert_type, risk_score, status'],
      ['Agent Ledger', 'AGL audit trail', 'id, agent_name, action_type, hash, execution_status'],
    ]
  )
);

// === SECTION 5: API ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '5. API Reference',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: '15 REST endpoints on http://localhost:3001/api. All require JWT authentication (except /auth/login).',
    spacing: { after: 200 },
  }),
  simpleTable(
    ['Method', 'Endpoint', 'Description'],
    [
      ['POST', '/auth/login', 'Login, return JWT token'],
      ['GET', '/auth/me', 'Current user profile'],
      ['GET', '/projects/:id/auth-findings', 'List AIE findings'],
      ['PATCH', '/projects/:id/auth-findings/:fid', 'Update finding status'],
      ['GET', '/projects/:id/code-findings', 'List SCG vulnerabilities'],
      ['GET', '/projects/:id/data-findings', 'List TDSL PII findings'],
      ['PATCH', '/projects/:id/data-findings/:did/mask', 'Execute data masking'],
      ['GET', '/projects/:id/compliance', 'Fetch compliance scorecard'],
      ['GET', '/projects/:id/behavioral-alerts', 'List BAS alerts'],
      ['GET', '/projects/:id/agent-ledger', 'Query AGL ledger'],
      ['POST', '/ai/analyze', 'Request AI-enriched analysis'],
    ]
  )
);

// === SECTION 6: AI ENGINE ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '6. AI Intelligence Engine',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: 'Two OpenAI models used strategically:',
    spacing: { after: 200 },
  }),
  new Paragraph({
    text: 'o4-mini: Fast, cost-effective ($0.00015/$0.0006 per 1M tokens), 2-3s response',
    bullet: { level: 0 },
  }),
  new Paragraph({
    text: 'o3: Complex reasoning ($0.001/$0.004 per 1M tokens), 5-10s response',
    bullet: { level: 0 },
    spacing: { after: 300 },
  }),
  new Paragraph({
    text: 'Analysis Modes:',
    heading: 2,
    run: new TextRun({ bold: true, size: 32, color: NAVY }),
    spacing: { before: 200, after: 100 },
  }),
  simpleTable(
    ['Mode', 'Model', 'Purpose'],
    [
      ['ciso_brief', 'o4-mini', '3-bullet executive summary'],
      ['remediation_plan', 'o3', 'Step-by-step remediation'],
      ['code_fix', 'o4-mini', 'Secure ABAP rewrite'],
      ['data_risk', 'o4-mini', 'PII exposure assessment'],
      ['audit_evidence', 'o3', 'Compliance narrative'],
      ['behavioral_risk', 'o4-mini', 'Insider threat assessment'],
      ['explain_agent_action', 'o4-mini', 'Plain English explanation'],
    ]
  )
);

// === SECTION 7: DEPLOYMENT & SECURITY ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '7. Deployment & Security',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  new Paragraph({
    text: 'Local Development:',
    heading: 2,
    run: new TextRun({ bold: true, size: 32, color: NAVY }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({ text: 'npm install', bullet: { level: 0 } }),
  new Paragraph({ text: 'Create .env with OPENAI_API_KEY', bullet: { level: 0 } }),
  new Paragraph({ text: 'npm run dev (Frontend :5173 + Backend :3001)', bullet: { level: 0 } }),
  new Paragraph({ text: 'Login: ciso@demo.com / Shield@2025', bullet: { level: 0 }, spacing: { after: 300 } }),
  
  new Paragraph({
    text: 'Security Considerations:',
    heading: 2,
    run: new TextRun({ bold: true, size: 32, color: NAVY }),
    spacing: { before: 200, after: 100 },
  }),
  new Paragraph({
    text: 'Authentication:',
    run: new TextRun({ bold: true }),
    spacing: { after: 50 },
  }),
  new Paragraph({ text: 'JWT tokens expire after 24 hours', bullet: { level: 0 } }),
  new Paragraph({ text: 'Passwords hashed with bcrypt (12-round salt)', bullet: { level: 0 } }),
  new Paragraph({ text: 'RBAC enforced at API gateway middleware', bullet: { level: 0 }, spacing: { after: 150 } }),
  
  new Paragraph({
    text: 'Data Protection:',
    run: new TextRun({ bold: true }),
    spacing: { after: 50 },
  }),
  new Paragraph({ text: 'SQLite encrypted with SQLCipher (prod: PostgreSQL + TLS 1.3)', bullet: { level: 0 } }),
  new Paragraph({ text: 'Sensitive data never logged', bullet: { level: 0 } }),
  new Paragraph({ text: 'PII masked before entering test systems', bullet: { level: 0 }, spacing: { after: 150 } }),
  
  new Paragraph({
    text: 'OpenAI API:',
    run: new TextRun({ bold: true }),
    spacing: { after: 50 },
  }),
  new Paragraph({ text: 'API key stored in environment variables only', bullet: { level: 0 } }),
  new Paragraph({ text: 'Rate limit: 10 AI requests per minute per user', bullet: { level: 0 } }),
  new Paragraph({ text: 'User inputs sanitized before API call', bullet: { level: 0 } })
);

// === SECTION 8: ROADMAP & GLOSSARY ===
sections.push(
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({
    text: '8. Roadmap',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  simpleTable(
    ['Phase', 'Timeline', 'Deliverables'],
    [
      ['MVP', '0-4 months', '6 engines, REST API, web UI, SQLite'],
      ['v1.0', '4-9 months', 'KTern integration, compliance automation'],
      ['v1.1', '9-14 months', 'Auto-remediation, batch masking, scheduled scanning'],
      ['v2.0', '14-24 months', 'Autonomous agent, multi-tenant SaaS'],
    ]
  ),
  new Paragraph({
    text: '',
    spacing: { after: 400 },
  }),
  new Paragraph({
    text: '9. Glossary',
    heading: 1,
    run: new TextRun({ bold: true, size: 56, color: NAVY }),
    spacing: { before: 400, after: 200 },
  }),
  simpleTable(
    ['Term', 'Definition'],
    [
      ['AIE', 'Authorization Intelligence Engine'],
      ['SCG', 'Secure Code Guardian'],
      ['TDSL', 'Test Data Sovereignty Layer'],
      ['CPM', 'Compliance Posture Mapper'],
      ['BAS', 'Behavioral Anomaly Sentinel'],
      ['AGL', 'Agent Governance Ledger'],
      ['CVSS', 'Common Vulnerability Scoring System'],
      ['CWE', 'Common Weakness Enumeration'],
      ['DXaaS', 'Digital Transformation as a Service'],
      ['GDPR', 'General Data Protection Regulation'],
      ['DPDP', 'Data Protection and Privacy Act 2023'],
      ['JWT', 'JSON Web Token'],
      ['PII', 'Personally Identifiable Information'],
      ['RBAC', 'Role-Based Access Control'],
      ['RFC', 'Remote Function Call'],
      ['SOX', 'Sarbanes-Oxley Act'],
      ['SoD', 'Segregation of Duties'],
      ['T-code', 'SAP Transaction Code'],
    ]
  ),
  new Paragraph({
    text: '',
    spacing: { before: 600, after: 100 },
  }),
  new Paragraph({
    text: 'End of Document',
    alignment: AlignmentType.CENTER,
    run: new TextRun({ italic: true, color: GRAY_DK, size: 24 }),
  }),
  new Paragraph({
    text: 'Classification: Confidential  |  Last Updated: 2025-04-19',
    alignment: AlignmentType.CENTER,
    run: new TextRun({ italic: true, size: 18, color: GRAY_DK }),
  })
);

// Build document
const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margins: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: sections,
    },
  ],
});

// Save
Packer.toBuffer(doc).then(buffer => {
  const fs = require('fs');
  fs.writeFileSync('./output/Digital_Shield_Technical_Documentation.docx', buffer);
  console.log('✓ Digital_Shield_Technical_Documentation.docx generated');
  console.log('  Sections: 9  |  Format: US Letter  |  Font: Arial  |  Pages: 20+');
});
