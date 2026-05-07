# KTern.AI Digital Shield — Technical Reference

## 1. Product Overview

**Digital Shield** is a cybersecurity intelligence module embedded within KTern.AI's DXaaS (Digital Transformation as a Service) platform. It addresses a critical security gap in SAP transformation projects: the 12-18 month window when legacy SAP instances are being migrated to S/4HANA while consultants have elevated access privileges, making this the single highest-risk period in the enterprise application lifecycle.

Traditional cybersecurity tools (SIEM, GRC platforms like Pathlock, Onapsis, SAP Access Control, and enterprise firewall systems) operate exclusively on production systems. They provide zero visibility during the transformation window because the target system is either offline, in pre-production sandbox states, or running with non-production data patterns.

Digital Shield fills this gap by embedding seven specialized security engines directly into the transformation lifecycle. These engines operate at transformation time (not production time), analyzing migration artifacts, test data, code migrations, configuration changes, and post-go-live drift as they flow through the KTern platform. The result is provably secure SAP transformations with auditable evidence trails.

**Key positioning:**
- Transforms SAP transformations, not production systems
- Operates across KTern's Digital Maps, Digital Labs, Digital Projects, Digital Mines, and AI Agent Space
- Generates AI-enriched security analysis via OpenAI o4-mini (standard) and o3 (complex reasoning)
- Provides executive visibility (CISO brief), security team deep-dives (module-specific findings), and auditor compliance evidence
- Supports 4 regulatory frameworks: SOX ITGC, GDPR, DPDP Act 2023, SAP Security Baseline v2

---

## 2. System Architecture

### 2.1 Layer Breakdown

| Layer | Description | Technology | Components |
|-------|-------------|-----------|------------|
| **Presentation** | User-facing interface with real-time analytics | React 18 + TypeScript + Tailwind CSS + Vite | Dashboards, module pages, visualization components, Recharts charts, Lucide icons |
| **Client Services** | API communication, routing, state management | React Router v6, Axios, Zustand, Custom Hooks | useAIAnalysis, useSecurityData, useComplianceStatus hooks |
| **API Gateway** | Request routing, authentication, authorization | Express 4.x + TypeScript + JWT middleware | 15 REST endpoints, RBAC enforcement, error handling, logging |
| **Security Engines** | Domain-specific analysis logic | Node.js + TypeScript | AIE, SCG, TDSL, CPM, BAS, AGL, VSE (7 parallel engines) |
| **AI Layer** | LLM-powered intelligence & reasoning | OpenAI API (o4-mini + o3 models) | Standard analysis (o4-mini), complex reasoning (o3), embeddings |
| **Data Layer** | Persistent storage with migration readiness | SQLite (development) / PostgreSQL (production) | 8 tables, 140+ seeded demo records, ACID transactions |

### 2.2 Data Flow

A typical user action flows through the system in 7 distinct stages:

1. **User Action** — User clicks "Generate Brief" or "Analyze Code" in the React UI
2. **HTTP Request** — Axios sends authenticated POST request to Express API with Bearer token and analysis context
3. **Middleware Processing** — JWT middleware validates token, RBAC middleware checks role permissions
4. **Engine Routing** — Express route handler instantiates appropriate security engine (AIE, SCG, TDSL, CPM, BAS, AGL, or VSE)
5. **Data Retrieval** — Engine queries SQLite for relevant findings, historical data, project context
6. **AI Enrichment** — Engine sends domain-specific prompt to OpenAI API, receives structured analysis
7. **Response Return** — Engine formats response as JSON, Express sends to frontend, React renders in AIInsightPanel component with formatting and copy-to-clipboard UX

### 2.3 Authentication & RBAC

Digital Shield implements JWT-based role-based access control with four distinct user roles:

| Role | Email Example | Permissions | Use Case |
|------|---------------|-------------|----------|
| **CISO** | ciso@demo.com | All features, all projects, can approve remediation workflows, view all alerts | Executive dashboard, strategic risk reporting, compliance sign-off |
| **Project Manager** | pm@demo.com | Read all findings, modify project metadata, approve schedule changes | Governance view, timeline management, stakeholder updates |
| **Security Analyst** | analyst@demo.com | View findings, generate AI analysis, propose remediations, cannot approve | Deep technical analysis, vulnerability investigation, fix validation |
| **Auditor** | auditor@demo.com | Read-only access to all findings, export reports, view compliance evidence | Compliance validation, evidence gathering, third-party audits |

All routes require a valid JWT token in the `Authorization: Bearer <token>` header. The RBAC guard middleware at the API gateway level enforces these permissions before any engine logic executes.

---

## 3. Security Engines

### 3.1 AIE — Authorization Intelligence Engine

**Tagline:** *Real-time Segregation of Duties analysis. Detect fraud vectors before they migrate.*

#### Problem Statement

During SAP migrations, hundreds of user-role assignments and role definitions are bulk-copied from legacy systems (ECC 6.0, ERP Central) to SAP S/4HANA without re-analysis. The bulk-copy approach preserves organizational context but introduces a fatal security flaw: Segregation of Duties (SoD) violations that were tolerated in mature legacy instances become acute fraud risks in newly-provisioned S/4HANA systems where there are fewer operational compensating controls.

Classic examples of SoD violations in SAP:
- **Accounts Payable fraud:** User has both FB60 (Create Vendor) + F110 (Execute Payments) → Can create ghost vendors and pay themselves
- **Procurement fraud:** User has ME21N (Create PO) + MIRO (Receive Invoice) → Can create fake invoices and approve payment
- **Revenue bypass:** User has VA01 (Create Sales Order) + VF01 (Create Invoice) → Can bypass pricing controls and issue unauthorized credit notes
- **Ghost vendor fraud:** User has FK01 (Create G/L Account) + F110 (Execute Payments) → Can create off-books accounts and funnel payments
- **Code execution risk:** User has SE38 (ABAP Editor) + SM49 (Batch Scheduler) → Can execute arbitrary code on SAP servers

#### Technical Approach

AIE ingests 4 primary SAP data sources:

1. **AGR_1251 Table** — Authorization profile definitions (field-level authorization objects)
2. **AGR_USERS Table** — User-role assignments (who has which roles)
3. **SU24 Configuration** — ABAP transaction authorization check indicators (which T-codes require which authorization objects)
4. **Project Discovery Data** — Landscape scan results from KTern Digital Maps (all Z-namespace custom developments)

The engine applies a ruleset of **40+ toxic T-code conflict pairs** detected through static pattern analysis. For each pair detected in a user's authorization profile, AIE:

- Scores the risk level (Critical/High/Medium/Low) based on business process impact
- Identifies affected user count (how many users have this SoD violation)
- Traces the role hierarchy (which roles contain these T-codes)
- Links to relevant regulatory frameworks (SOX CC6.1, GDPR Art. 32)
- Generates a remediation workflow (reassign user, remove T-code from role, create segregated role)

#### Data Sources

| Source | Table/API | Data Provided | Frequency |
|--------|-----------|----------------|-----------|
| SAP Security | AGR_USERS | User-role assignments | Per migration phase |
| SAP Security | AGR_1251 | Authorization profile definitions | Per migration phase |
| SAP Configuration | SU24 | T-code → auth object mappings | Per migration phase |
| SAP Audit Log | SM20 | Historical access patterns (for context) | Real-time during migration |
| KTern Digital Maps | Landscape API | Role discovery from source system | Per scanning cycle |

#### Outputs

1. **Finding List** — Prioritized JSON array of SoD violations:
   ```json
   {
     "id": "aie-sod-001",
     "type": "segregation_of_duties_violation",
     "severity": "critical",
     "tcode_pair": ["FB60", "F110"],
     "business_process": "Accounts Payable",
     "affected_users": 12,
     "affected_roles": ["Z_AP_MANAGER", "Z_AP_SENIOR"],
     "fraud_vector": "Create vendor + execute payments",
     "regulation_refs": ["SOX_CC6.1", "GDPR_ART32"],
     "evidence": { "table": "AGR_USERS", "role_ids": ["Z_AP_MANAGER"] },
     "remediation_options": [
       { "action": "Split role", "effort": "Medium", "timeline": "1 week" },
       { "action": "Restrict user assignment", "effort": "Low", "timeline": "1 day" }
     ]
   }
   ```

2. **CISO Brief** — Executive summary with risk scoring
3. **Remediation Plan** — AI-generated step-by-step fixing strategy (OpenAI o3)
4. **Audit Evidence** — SOX/GDPR compliance documentation

#### KTern Integration Hook

- **Integration Point:** KTern Digital Maps role discovery module
- **How it works:** AIE consumes role object inventory from Digital Maps landscape scanning, enriches it with SoD violation detection, feeds findings back into the project risk dashboard
- **Business Value:** Transform role migration from "copy and pray" to "copy and validate," reduce fraud exposure from 12-18 months to zero risk on day-1 go-live

---

### 3.2 SCG — Secure Code Guardian

**Tagline:** *ABAP code security at transformation time. Catch vulnerable patterns before they go live.*

#### Problem Statement

SAP transformation projects typically migrate 500-5,000 Z-namespace custom ABAP programs, function modules, and reports from legacy systems to S/4HANA. These programs were written over 10-20 years with varying security practices. Manual code review of thousands of programs is infeasible in a transformation timeline.

Common vulnerabilities in Z-namespace code:
- **Missing AUTHORITY-CHECK:** Authorization checks are optional in ABAP (unlike some languages where security is enforced by the runtime). Many legacy programs skip authorization checks entirely, relying on role-based access to the transaction code. This breaks if the role is later incorrectly assigned or if direct program call bypasses the transaction code.
- **Hardcoded credentials:** Database passwords, SAP user IDs, and RFC connection credentials embedded in source code (not using SM59 RFC destinations or SAP password management)
- **SQL injection via Dynamic SELECT:** `SELECT * FROM <table_name_variable> WHERE <condition_variable>` without parameterization allows SQL injection through Z-table names or WHERE clause injection
- **RFC abuse:** Calling remote systems (RFCs) with elevated credentials or without re-validating authorization in the remote system
- **Open cursor problems:** File handles or database cursors left open in exception paths, causing resource leaks and eventual system hangs

#### Technical Approach

SCG performs **pattern-based static analysis** on migrated Z-namespace ABAP code. It does not execute the code; instead, it uses regex patterns and AST-style parsing to detect known vulnerability signatures.

Five detection categories:

1. **missing_auth_check** — Transactions without AUTHORITY-CHECK statements at entry point
2. **hardcoded_credential** — String literals matching password, user, or credential patterns (e.g., `'PASSWORD123'`, `USERID = 'SAP_USER'`)
3. **sql_injection** — Dynamic SELECT/UPDATE/DELETE with unsanitized variables
4. **rfc_abuse** — RFC_READ_TABLE or remote RFC calls without auth context switching
5. **open_cursor** — Database cursors or file handles not closed in CATCH/FINALLY paths

Each finding is scored using **CVSS v3 (Common Vulnerability Scoring System)** methodology:
- **CVSS 9-10 (Critical)** — Missing auth check in financial transaction
- **CVSS 7-8.9 (High)** — Hardcoded credential in batch process, SQL injection in public module
- **CVSS 5-6.9 (Medium)** — RFC abuse with proper parameter handling, cursor leak in non-critical process
- **CVSS 2-4.9 (Low)** — Minor resource leak, defensive coding practice gap

#### Data Sources

| Source | Format | Data Provided | Frequency |
|--------|--------|----------------|-----------|
| SAP Transport | .TXT export | ABAP source code for all Z-namespace programs | Per transport request |
| KTern Digital Labs | API | Code scanning results from transformation sandboxes | Per build cycle |
| GitHub/DevOps | Repository | Migrated Z-code branches ready for deployment | Per merge request |
| SAP Code Repository | SE80 export | Program metadata, includes, subroutines | Per migration phase |

#### Outputs

1. **Finding List** with code snippets (line numbers, vulnerable code excerpt, CVSS score, CWE identifier):
   ```json
   {
     "id": "scg-auth-001",
     "object_name": "ZRFQ_CREATION",
     "object_type": "PROGRAM",
     "finding_type": "missing_auth_check",
     "severity": "high",
     "line_number": 42,
     "code_snippet": "CALL TRANSACTION 'ME41' ... \n* No AUTHORITY-CHECK for auth object 'ME' action 'create'",
     "cvss_score": 8.2,
     "cwe_id": "CWE-250",
     "cwe_name": "Execution with Unnecessary Privileges",
     "fix_recommendation": "Add: AUTHORITY-CHECK OBJECT 'ME' ID 'ACTVT' FIELD '01'.",
     "ai_fix": "// [Generated by OpenAI o4-mini]\n** Authorization check for purchasing document creation\nAUTHORITY-CHECK OBJECT 'ME'\n  ID 'ACTVT' FIELD '01'\n  ID 'EBAN' FIELD lv_eban_num.\nIF sy-subrc <> 0.\n  MESSAGE e001 WITH 'You do not have permission to create RFQs'.\nENDIF."
   }
   ```

2. **Secure ABAP rewrite** — AI-generated secure code template (OpenAI o4-mini)
3. **CWE/CVSS mapping** — For compliance evidence and risk reporting

#### KTern Integration Hook

- **Integration Point:** KTern Digital Labs code quality and security scanning
- **How it works:** SCG hooks into the build pipeline during code migration. Every Z-namespace program is scanned before transport request approval. Results feed into the Code Guardian dashboard and trigger AI fix recommendations.
- **Business Value:** Eliminate security review as a transformation bottleneck. Every vulnerable pattern is caught automatically with suggested fixes, reducing code review cycle from weeks to days.

---

### 3.3 TDSL — Test Data Sovereignty Layer

**Tagline:** *Intercept production PII in test data. Masking automation for GDPR compliance.*

#### Problem Statement

SAP projects require realistic test data to validate business processes. The fastest way to get realistic data is to copy production data. However, production data contains:
- **Employee PII:** Salary (PA0008/ANSAL), national ID (PA0002/PERID), phone numbers (PA0001/TELNO), email (PA0001/SMTP_ADDR)
- **Bank account information:** Bank account numbers (PA0009/BANKN), routing codes, salary payment details
- **Customer financial data:** Invoice amounts (BSEG/WRBTR), payment history (KNA1 credit limit), contract terms (VBAK)
- **Healthcare/Sensitive:** Medical history (if integrated with HR systems), dependent information

Copying this data into UAT/SIT environments without masking violates:
- **GDPR Article 32** — Data controllers must implement technical and organizational measures to protect personal data
- **DPDP Act 2023** — India's data protection law requiring explicit consent and data minimization
- **HIPAA** — If healthcare data is integrated (USA)
- **SOX** — Separation between production and non-production data environments
- **Local data residency laws** — Many countries prohibit transferring citizen PII across borders

#### Technical Approach

TDSL intercepts test dataset uploads into KTern Digital Labs and applies a three-step workflow:

**Step 1: Detection** — Scans dataset against 200+ SAP table/field PII classification rules:
```
PA0001 (Employee Master)     → TELNO (phone), SMTP_ADDR (email)
PA0002 (Employee Master)     → PERID (national ID), VORNA (first name), NACHN (last name)
PA0008 (Employee Master)     → ANSAL (salary amount), WGTYP (pay type)
PA0009 (Employee Master)     → BANKN (bank account), BLART (account type)
KNA1 (Customer Master)       → KREDITLIMIT (credit limit), NAME1 (customer name)
BSEG (Accounting Document)   → WRBTR (amount), BSCHL (document type)
VBAK (Sales Order Header)    → VBELN (order number), ERDAT (creation date)
T001 (Company Code)          → Various sensitive configuration
```

**Step 2: Masking** — Generates masking rules:
```
Email (PA0001/SMTP_ADDR)     → Replace with synthetic: user.123@example.com
Phone (PA0001/TELNO)         → Replace with synthetic: +1-555-0100
Salary (PA0008/ANSAL)        → Shuffle within quartile (preserve distribution)
Bank Account (PA0009/BANKN)  → Replace with fake IBAN: DE89370400440532013000
Customer Name (KNA1/NAME1)   → Replace with synthetic: Customer_001
Order Amount (BSEG/WRBTR)    → Scale by 0.5-2x multiplier (preserve pattern)
```

**Step 3: Audit Trail** — Creates immutable record:
```json
{
  "dataset_id": "tdsl-20250419-001",
  "uploaded_at": "2025-04-19T08:30:00Z",
  "uploaded_by": "analyst@ktern.ai",
  "masking_applied": {
    "PA0001": { "SMTP_ADDR": "masked", "TELNO": "masked" },
    "PA0008": { "ANSAL": "shuffled" },
    "PA0009": { "BANKN": "replaced" }
  },
  "records_masked": 8500,
  "pii_fields_detected": 15,
  "regulation_framework": "GDPR",
  "masking_hash": "sha256:a3f7e..."
}
```

#### Data Sources

| Source | Format | Data Provided | Frequency |
|--------|--------|----------------|-----------|
| SAP Tables | Database export | Production data for UAT copy | Per test cycle |
| Data Classification | Metadata | PII field definitions (SAP table → field → sensitivity) | Static config |
| KTern Digital Labs | API | Test dataset uploads, staging area | Per upload |
| Regulatory Config | JSON | Active compliance frameworks (GDPR, DPDP, HIPAA) | Per project |

#### Outputs

1. **Masking Report:**
   ```json
   {
     "dataset": "UAT_COPY_20250419",
     "total_records": 8500,
     "pii_findings": [
       { "table": "PA0001", "field": "SMTP_ADDR", "record_count": 8500, "pii_type": "email", "regulation": "GDPR" },
       { "table": "PA0008", "field": "ANSAL", "record_count": 8500, "pii_type": "salary", "regulation": "GDPR, DPDP" }
     ],
     "masking_applied": true,
     "heatmap": { "GDPR": 15, "DPDP": 8, "HIPAA": 0, "SOX": 3 }
   }
   ```

2. **Data lineage audit trail** — For auditor sign-off on GDPR compliance
3. **Masking workflow** — For security review and approval before applying

#### KTern Integration Hook

- **Integration Point:** KTern Digital Labs test data management
- **How it works:** Every test dataset upload is intercepted. TDSL scans for PII, proposes masking rules, and requires security analyst approval before the data enters the test environment. Results feed into compliance scorecard.
- **Business Value:** Eliminate manual data masking scripts. Reduce compliance risk from "hope our DBA didn't expose PII" to "guaranteed masking + audit trail." Enable fast test cycles without regulatory fear.

---

### 3.4 CPM — Compliance Posture Mapper

**Tagline:** *Live compliance scorecard. Map findings to controls in real-time.*

#### Problem Statement

CISOs and compliance officers have zero visibility into SAP transformation security during the 12-18 month migration window. Traditional GRC tools (ServiceNow, AuditBoard, LogicGate) operate on production systems and mature control environments. They're useless for assessing a system-under-transformation.

Post-go-live, external auditors (Big 4 firms, sector-specific auditors) arrive to validate SOX ITGC or GDPR compliance. By then, if critical security failures were introduced during transformation, the entire project is at risk of audit failure, delayed remediation, or even forced rollback.

#### Technical Approach

CPM maps all Digital Shield findings (AIE violations, SCG vulnerabilities, TDSL PII risks, BAS alerts, AGL anomalies) to standardized control frameworks:

**Supported Frameworks:**

| Framework | ID Format | Count | Primary Use |
|-----------|-----------|-------|------------|
| SOX ITGC | CC6.1-CC6.3, CC7.1-CC7.2 | 18 controls | US public companies, Sarbanes-Oxley compliance |
| GDPR | Art.5, Art.25, Art.32 | 8 controls | All EU/UK data processing |
| DPDP Act 2023 | DPA.2, DPA.6, DPA.8 | 6 controls | India data protection |
| SAP Security Baseline v2 | SB.2.x, SB.3.x, SB.4.x | 42 controls | SAP-specific security hardening |

**Mapping Logic:**

```
AIE Finding: "SoD violation: FB60 + F110"
  ↓ (maps to)
SOX Control: CC6.1 - Segregation of duties
SOX Control: CC6.2 - Authorization of transactions
  ↓ (maps to)
GDPR Article: Art.32 - Security of processing
  ↓ (maps to)
SAP Baseline: SB.3.2.1 - Role segregation validation
  ↓ (updates)
Compliance Status: "1 of 4 controls failing"
Compliance Score: 65/100 (starts at 100, -10 per control failure)
```

Each control gets a status badge:
- **Not Started** (gray) — No evidence, no findings mapped
- **In Progress** (yellow) — Findings detected, remediation workflow initiated
- **Remediated** (green) — Findings resolved, evidence collected
- **Failed** (red) — Findings unresolved past remediation deadline

#### Data Sources

| Source | API/Table | Data Provided | Frequency |
|--------|-----------|----------------|-----------|
| Digital Shield Engines | AIE, SCG, TDSL, BAS, AGL | All findings in JSON format | Real-time |
| Regulatory Mapping | Metadata config | Framework ↔ Finding type mappings | Static |
| KTern Projects | API | Project milestones, timelines, go-live date | Per project update |
| Audit Evidence Store | Database | Remediation proof, approvals, sign-offs | As collected |

#### Outputs

1. **Compliance Scorecard — Per Framework:**
   ```json
   {
     "project_id": "proj-20250419",
     "framework": "SOX_ITGC",
     "score": 72,
     "status": "in_progress",
     "controls": [
       { "control_id": "CC6.1", "name": "Segregation of Duties", "status": "in_progress", "findings": 3, "evidence": "aie-remediation-plan-001" },
       { "control_id": "CC6.2", "name": "Authorization", "status": "remediated", "findings": 0, "evidence": "audit-approval-001" },
       { "control_id": "CC7.1", "name": "User Access Management", "status": "failed", "findings": 5, "evidence": null }
     ]
   }
   ```

2. **Compliance trend** — Historical score progression (week-by-week)
3. **Audit evidence narrative** — AI-generated formal documentation (OpenAI o3) for external auditors

#### KTern Integration Hook

- **Integration Point:** KTern Digital Projects milestone tracking
- **How it works:** CPM listens to project state changes. As milestones complete (code migration, role provisioning, testing), associated findings move through remediation workflows. Compliance score updates in real-time, feeding a live dashboard widget.
- **Business Value:** Transform compliance from reactive ("hope audit passes") to proactive ("see compliance trajectory day-by-day"). Enable auditors to sign off continuously rather than post-go-live scramble.

---

### 3.5 BAS — Behavioral Anomaly Sentinel

**Tagline:** *Insider threat detection for consultants. Real-time anomaly scoring.*

#### Problem Statement

SAP transformation projects involve consultants with elevated access for 12-18 months. This is the highest-risk insider threat window in enterprise IT:
- Consultants have access to entire application (vs. typical employees who can only execute job duties)
- Consultant access is often temporary but sometimes "forgotten" after project ends
- Behavioral baselines cannot be established (consultants are new to the system)
- Traditional SIEM solutions have no context that these elevated privileges are temporary and scoped to transformation

Known real-world scenarios:
- Consultant extracts entire customer database (KNA1, VBAK) on final project day
- Consultant creates new payment run (F110) with "consulting invoice" to fraudulent vendor
- Consultant grants themselves SA access (SU01) to create permanent back-door account
- Consultant logs in from 5 countries in 8 hours (account share/compromise)

#### Technical Approach

BAS consumes three data streams:

**Stream 1: KTern Digital Mines DevOps Telemetry**
- Agent deployment events (who logged in to SAP sandboxes)
- Configuration changes (who modified parameters)
- Data export operations (who ran export jobs)

**Stream 2: SAP Security Audit Log (SM20)**
- Successful and failed login attempts
- Transaction executions (all T-codes executed)
- Authorization failures (who tried to do what but couldn't)
- Security events (role changes, user creation, password changes)

**Stream 3: KTern Platform Activity**
- Project milestone completions (when does elevated access end?)
- User role lifecycle (when was consultant access provisioned? removed?)
- Geographic location (from VPN logs, IP geolocation)

**Alert Types (5 total):**

| Alert Type | Threshold | Risk Score | Example |
|------------|-----------|-----------|---------|
| **off_hours_access** | Login between 22:00–06:00 on weekend | 45 | Consultant logs in 3 AM Sunday |
| **mass_data_export** | Download >100MB or >10K records | 75 | Consultant exports entire VBAK table (500MB) |
| **privilege_escalation** | User execution of SU01, SU02, PFCG | 90 | Consultant creates new SAP account with admin role |
| **unusual_tcode** | T-code rarely executed by role | 60 | Consultant (normally runs SE38) suddenly executes F110 (payment creation) |
| **transport_anomaly** | Transport deployed outside change window | 55 | Custom Z-code transported to production on Friday evening |

Each alert is scored 0-100 with formula:
```
Risk = (Alert_Base_Risk + Escalation_Factor) × Historical_Anomaly_Multiplier

Alert_Base_Risk = alert type base score (45-90)
Escalation_Factor = +10 if multiple alerts in 1 hour, +20 if multiple in 15 min
Historical_Anomaly_Multiplier = (1 + count_similar_alerts_past_30days) × 0.1

Example: Privilege escalation (90 base) + escalation (10) × (1 + 0 previous) = 100
```

#### Data Sources

| Source | API/Log | Data Provided | Frequency |
|--------|---------|----------------|-----------|
| KTern Digital Mines | Agent telemetry API | Deployment, config change events | Real-time, 1-minute granularity |
| SAP Audit Log | SM20 database | Login, transaction, auth failure events | Real-time, streamed |
| KTern Platform | Activity API | User provisioning, role changes, project events | Real-time |
| IP Geolocation | Third-party API | Geographic location from IP address | Per login |

#### Outputs

1. **Alert Feed** (chronological, queryable):
   ```json
   {
     "id": "bas-alert-001",
     "timestamp": "2025-04-18T02:30:45Z",
     "user": "consultant.john@example.com",
     "alert_type": "mass_data_export",
     "description": "Exported 542 MB from KNA1 table",
     "risk_score": 85,
     "severity": "high",
     "status": "open",
     "investigation_workflow": {
       "status": "investigating",
       "owner": "analyst@ktern.ai",
       "notes": "John requested data for downstream integration testing. Approved in change ticket CT-12345."
     }
   }
   ```

2. **User × Day Heatmap** — Visual grid showing which users have elevated behavior on which days
3. **Investigation workflow** — Open → Investigating → Cleared or Escalated

#### KTern Integration Hook

- **Integration Point:** KTern Digital Mines DevOps orchestration + SAP Audit Log capture
- **How it works:** BAS subscribes to KTern agent telemetry and SAP audit streams. Every consultant action (login, data export, privilege change) is scored for anomaly. High-risk alerts appear in the Behavioral Sentinel dashboard and trigger investigation workflows.
- **Business Value:** Catch insider threats in real-time during the highest-risk transformation window. Prove consultant behavior was authorized (audit trail) or escalate to incident response.

---

### 3.6 AGL — Agent Governance Ledger

**Tagline:** *Immutable audit trail for autonomous AI agents. Tamper-proof execution logs.*

#### Problem Statement

KTern.AI's AI Agents act autonomously on SAP systems (creating users, modifying roles, executing transports, approving workflows). CISOs cannot authorize agentic AI in enterprise systems without answers to critical questions:

- What exactly did this agent do?
- Who/what triggered the agent?
- What data did the agent access?
- What was the outcome?
- Can I prove the agent's actions were authorized?
- If something went wrong, can I roll it back?

Traditional logging (application logs, database logs) is mutable and often purged. Audit logs can be tampered with by system administrators. Production systems lack context about whether an agent action was intentional (approved) or anomalous.

#### Technical Approach

AGL wraps every KTern AI Agent execution at the orchestration layer. Before any agent performs an action, AGL creates a **ledger entry** capturing:

```json
{
  "ledger_id": "agl-ledger-20250419-001",
  "timestamp": "2025-04-19T10:30:00Z",
  "agent_name": "RoleSegregationFixer",
  "agent_version": "1.2.1",
  "triggering_user": "analyst@ktern.ai",
  "triggering_event": "remediation_workflow_approved",
  "action_type": "modify_role",
  "target_object": "ZFIAP_MANAGER",
  "target_system": "SID_PRD_S4H",
  "data_fields_accessed": ["AGR_1251.AGRT", "AGR_USERS.MANDT"],
  "intended_outcome": "Remove T-code FB60 from role ZFIAP_MANAGER",
  "execution_status": "success",
  "result": {
    "fields_modified": 1,
    "records_affected": 8,
    "transaction_id": "00001234567890"
  },
  "risk_level": "medium",
  "hash": "sha256:a3f7e2c9d1b4e6f8a0c2d4e6f8a0c2d4",
  "hash_parent": "sha256:f0e8d6c4b2a0f8e6d4c2b0a8f6e4d2c0"  // chain link
}
```

**Tamper detection:**
- Each entry is hashed using SHA-256 over the full entry JSON
- Hash is stored alongside the entry
- Ledger entries are **append-only** — no UPDATE or DELETE operations permitted
- `hash_parent` field links each entry to the previous one, creating an immutable chain (blockchain-like)
- Any modification to a past entry breaks the chain (hash mismatch)

**Access control:**
- Only `SELECT` permitted on ledger entries (read-only for auditors)
- `INSERT` permitted only by the AGL service (no direct writes)
- `DELETE` never permitted (not even by DB admin)
- Physical read-only replica can be sent to external auditors (Deloitte, PWC, etc.)

#### Data Sources

| Source | API/Event | Data Provided | Frequency |
|--------|-----------|----------------|-----------|
| KTern AI Orchestration | Agent lifecycle events | Agent name, version, trigger, intended action | Per agent execution |
| SAP Transaction Log | RFC call results | Outcome, records affected, transaction IDs | Real-time, post-execution |
| User Identity | IAM integration | Triggering user, approvals chain | Per execution |
| System Telemetry | KTern monitoring | Execution latency, resource usage, errors | Per execution |

#### Outputs

1. **Ledger Entry:**
   ```json
   [
     { "ledger_id": "agl-...-001", "agent": "RoleSegregationFixer", ... },
     { "ledger_id": "agl-...-002", "agent": "CodeSecurityFixer", ... },
     { "ledger_id": "agl-...-003", "agent": "DataMaskingOrchestrator", ... }
   ]
   ```

2. **Hash integrity report** — For auditors: shows chain is unbroken, no tampering
3. **Plain-English explanation** — AI-generated summary of any entry (OpenAI o4-mini):
   ```
   Agent action: RoleSegregationFixer successfully removed T-code FB60 (Create Vendor) from role ZFIAP_MANAGER 
   on 2025-04-19. This addresses AIE finding SoD-002 (Accounts Payable fraud vector). 8 users were affected. 
   Action was triggered by analyst analyst@ktern.ai following approved remediation workflow CT-12345. 
   Risk level: Medium (role modification requires change approval, which was obtained).
   ```

4. **Full JSON export** — For external audit, compliance systems, or security forensics

#### KTern Integration Hook

- **Integration Point:** KTern AI Agent Space (orchestration layer)
- **How it works:** Every KTern AI Agent execution is pre-wrapped with AGL context capture. The agent performs its SAP mutation (role modification, user creation, code deployment, etc.), then AGL records the outcome immutably. Ledger is queryable and exportable by CISOs and auditors.
- **Business Value:** CISOs can confidently delegate SAP security operations to autonomous AI agents without losing auditability. Every action is locked in an immutable, hash-verified ledger that survives any DB tampering attempt.

---

### 3.7 VSE â€” Vulnerability Surface Engine

**Tagline:** *Post-go-live security drift detection. Scan, regress, and certify production readiness continuously.*

#### Problem Statement

Transformation-time security checks are necessary but insufficient. Even after go-live, risk can be reintroduced quickly by:

- Emergency transports that bypass full security review
- Role changes that re-open previously remediated SoD or privileged-access patterns
- Profile parameter drift (e.g., weakened password/RFC settings)
- Re-enabled default users or exposed ICF/RFC endpoints
- Gateway configuration changes that expand remote execution surface

Without post-go-live vulnerability surface monitoring, organizations can pass cutover with a strong posture and lose it within days.

#### Technical Approach

VSE adds a post-go-live control plane with four operating modes:

1. **Production Scan** â€” Captures live vulnerability findings against production-relevant components
2. **Regression Checks** â€” Re-checks risk posture when change events occur (transport deployed, role modified, parameter changed, user batch created)
3. **Handover Report** â€” Generates structured security handover evidence for CISO review/sign-off
4. **Continuous Monitoring** â€” Tracks scheduled/on-change monitoring subscriptions and recent results

VSE tracks six vulnerability classes:

- `open_rfc_destination`
- `default_user_active`
- `debug_access_granted`
- `icf_service_exposed`
- `profile_parameter_misconfiguration`
- `gateway_security_gap`

Each finding includes severity, affected object, technical detail, remediation guidance, CVSS score, status, and detection timestamp.
VSE computes a dedicated risk score from open findings:

- `critical_open * 15`
- `high_open * 8`
- `medium_open * 4`
- `low_open * 2`
- `vse_risk_score = max(0, 100 - weighted_penalty)`

#### Data Sources

| Source | Table/API | Data Provided | Frequency |
|--------|-----------|----------------|-----------|
| VSE Findings Store | `vse_findings` | Production and regression findings with CVSS, status, affected objects | On scan + on change |
| Change Event Stream | `vse_change_events` | Trigger events (transport, role, parameter, user batch) and regression result state | Real-time |
| Handover Registry | `vse_handover_reports` | Final score, baseline snapshot, open risks, sign-off state | Per handover cycle |
| Monitoring Config | `vse_monitoring` | Check type, frequency (on_change/daily/weekly), last run/result | Continuous |
| AI Layer | `/api/ai/analyze` (`handover_narrative`) | Executive narrative for handover package | On demand |

#### Outputs

1. **VSE Summary** â€” Open severity counts, post-go-live totals, and risk score:
   ```json
   {
     "project_id": "proj-20250419-001",
     "total_findings": 18,
     "critical_open": 3,
     "high_open": 5,
     "medium_open": 4,
     "low_open": 1,
     "post_golive_findings_total": 12,
     "vse_risk_score": 21
   }
   ```

2. **Finding Register** â€” Filterable list by `scan_type`, `finding_type`, `severity`, `status`, and text search
3. **Regression Timeline** â€” Change-event list with `regression_status` and `findings_count`
4. **Security Handover Package** â€” Final score, baseline snapshot, open risk items, AI narrative, and CISO sign-off workflow
5. **Monitoring Dashboard** â€” Active check subscriptions with execution recency and latest result

#### KTern Integration Hook

- **Integration Point:** KTern post-go-live operations layer (transport/change governance + security monitoring)
- **How it works:** VSE listens for post-go-live system changes, triggers regression scans, updates finding posture in real-time, and compiles handover evidence for executive approval.
- **Business Value:** Prevents security regressions after cutover. Teams move from one-time go-live assurance to continuous vulnerability surface control.

---

## 4. Database Schema

### Overview

Digital Shield uses **SQLite** for local development with a schema that is **PostgreSQL-ready** for production deployments. Core and module-specific tables use standard SQL data types and support ACID transactions. The database is seeded with realistic demo records spanning all 7 security modules.

### 4.1 Users Table

**Purpose:** Authentication and role management. Stores user profiles with JWT token issuance.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "usr-20250419-001") |
| `email` | TEXT | NOT NULL, UNIQUE | Email address, used as login credential |
| `name` | TEXT | NOT NULL | Full name for UI display |
| `password_hash` | TEXT | NOT NULL | bcrypt hash of password (never stored plaintext) |
| `role` | TEXT | NOT NULL, CHECK(role IN ('ciso', 'project_manager', 'security_analyst', 'auditor')) | User role for RBAC |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project assignment (user can view/modify this project) |
| `last_login` | INTEGER | NULL | Unix timestamp of last successful login |
| `created_at` | INTEGER | NOT NULL, DEFAULT(CURRENT_TIMESTAMP) | Account creation timestamp |

**Example records:**
- `ciso@demo.com` / Role: ciso / Project: proj-20250419
- `analyst@demo.com` / Role: security_analyst / Project: proj-20250419

### 4.2 Projects Table

**Purpose:** SAP transformation project metadata. One project = one migration (e.g., ECC 6.0 → S/4HANA PRD).

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "proj-20250419-001") |
| `name` | TEXT | NOT NULL | Project name (e.g., "Global S/4 Migration - Phase 2") |
| `client` | TEXT | NOT NULL | SAP client number (e.g., "100", "200") |
| `migration_type` | TEXT | NOT NULL, CHECK(...IN('brownfield', 'greenfield', 'selective_data_transfer')) | Migration strategy |
| `source_system` | TEXT | NOT NULL | Source system name (e.g., "ECC 6.0 PRD", "ERP Central") |
| `target_system` | TEXT | NOT NULL | Target system name (e.g., "S/4HANA 2023 PRD") |
| `phase` | TEXT | NOT NULL, CHECK(...IN('discovery', 'design', 'build', 'test', 'deploy', 'cutover', 'support')) | Current project phase |
| `overall_risk_score` | INTEGER | DEFAULT(0), CHECK(... BETWEEN 0 AND 100) | Aggregated risk 0-100 |
| `compliance_score` | INTEGER | DEFAULT(0), CHECK(... BETWEEN 0 AND 100) | Aggregated compliance score 0-100 |
| `created_at` | INTEGER | NOT NULL, DEFAULT(CURRENT_TIMESTAMP) | Project creation timestamp |
| `go_live_date` | INTEGER | NULL | Unix timestamp of planned go-live |

### 4.3 Auth Findings Table (AIE Results)

**Purpose:** Segregation of Duties violations. One row = one violation.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "aie-sod-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project this finding belongs to |
| `finding_type` | TEXT | NOT NULL, CHECK(...IN('segregation_of_duties', 'over_privilege', 'orphaned_role', 'wildcard_auth')) | Finding classification |
| `severity` | TEXT | NOT NULL, CHECK(...IN('critical', 'high', 'medium', 'low')) | Risk severity |
| `role_name` | TEXT | NOT NULL | SAP role name (e.g., "ZFIAP_MANAGER") |
| `tcode_1` | TEXT | NULL | First T-code in conflict pair (e.g., "FB60") |
| `tcode_2` | TEXT | NULL | Second T-code in conflict pair (e.g., "F110") |
| `user_count` | INTEGER | DEFAULT(0) | Number of users affected by this violation |
| `status` | TEXT | NOT NULL, DEFAULT('open'), CHECK(...IN('open', 'in_remediation', 'remediated', 'accepted_risk')) | Finding status |
| `remediation_plan` | TEXT | NULL | AI-generated remediation steps (JSON) |
| `detected_at` | INTEGER | NOT NULL, DEFAULT(CURRENT_TIMESTAMP) | When this finding was detected |

### 4.4 Code Findings Table (SCG Results)

**Purpose:** ABAP code vulnerabilities. One row = one vulnerable code pattern.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "scg-auth-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project this finding belongs to |
| `object_name` | TEXT | NOT NULL | ABAP program/module name (e.g., "ZRFQ_CREATION") |
| `object_type` | TEXT | NOT NULL, CHECK(...IN('program', 'function_module', 'class', 'report')) | ABAP object type |
| `finding_type` | TEXT | NOT NULL, CHECK(...IN('missing_auth_check', 'hardcoded_credential', 'sql_injection', 'rfc_abuse', 'open_cursor')) | Vulnerability type |
| `severity` | TEXT | NOT NULL, CHECK(...IN('critical', 'high', 'medium', 'low')) | CVSS severity |
| `line_number` | INTEGER | NULL | Source code line number of vulnerability |
| `code_snippet` | TEXT | NULL | Vulnerable code excerpt |
| `cvss_score` | REAL | NOT NULL, DEFAULT(0.0), CHECK(... BETWEEN 0 AND 10) | CVSS v3 score (0-10) |
| `cwe_id` | TEXT | NULL | CWE identifier (e.g., "CWE-250") |
| `status` | TEXT | NOT NULL, DEFAULT('open'), CHECK(...IN('open', 'in_remediation', 'fixed', 'accepted_risk')) | Finding status |
| `ai_fix` | TEXT | NULL | AI-generated secure code rewrite |
| `detected_at` | INTEGER | NOT NULL, DEFAULT(CURRENT_TIMESTAMP) | When vulnerability was detected |

### 4.5 Data Findings Table (TDSL Results)

**Purpose:** PII data classification and masking requirements. One row = one PII field in a dataset.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "tdsl-pii-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project this finding belongs to |
| `dataset_name` | TEXT | NOT NULL | Dataset name (e.g., "UAT_COPY_20250419") |
| `table_name` | TEXT | NOT NULL | SAP table name (e.g., "PA0001", "PA0008") |
| `field_name` | TEXT | NOT NULL | Field name (e.g., "SMTP_ADDR", "ANSAL") |
| `pii_type` | TEXT | NOT NULL, CHECK(...IN('email', 'phone', 'salary', 'bank_account', 'national_id', 'name', 'address')) | PII classification |
| `regulation` | TEXT | NOT NULL | Regulation framework (e.g., "GDPR, DPDP") |
| `record_count` | INTEGER | NOT NULL | Records in dataset containing PII |
| `masked` | INTEGER | DEFAULT(0) | Records already masked |
| `masking_status` | TEXT | NOT NULL, DEFAULT('pending'), CHECK(...IN('pending', 'approved', 'masked', 'failed')) | Masking workflow status |
| `detected_at` | INTEGER | NOT NULL, DEFAULT(CURRENT_TIMESTAMP) | When PII was detected |

### 4.6 Compliance Controls Table (CPM Results)

**Purpose:** Control mapping and compliance status. One row = one control framework control.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "cpm-cc61-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project this control belongs to |
| `framework` | TEXT | NOT NULL, CHECK(...IN('sox_itgc', 'gdpr', 'dpdp', 'sap_baseline')) | Regulatory framework |
| `control_id` | TEXT | NOT NULL | Framework control identifier (e.g., "CC6.1", "ART32") |
| `control_name` | TEXT | NOT NULL | Control description (e.g., "Segregation of Duties") |
| `status` | TEXT | NOT NULL, DEFAULT('not_started'), CHECK(...IN('not_started', 'in_progress', 'remediated', 'failed')) | Control status |
| `evidence` | TEXT | NULL | Reference to evidence (audit finding ID, approvals) |
| `findings_mapped` | INTEGER | DEFAULT(0) | Number of Digital Shield findings mapped to this control |
| `findings_resolved` | INTEGER | DEFAULT(0) | Number of mapped findings already resolved |
| `last_assessed` | INTEGER | NULL | Unix timestamp of last assessment |

### 4.7 Behavioral Alerts Table (BAS Results)

**Purpose:** Insider threat alerts. One row = one anomalous user action.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "bas-alert-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project this alert belongs to |
| `user_name` | TEXT | NOT NULL | SAP user ID or email (e.g., "consultant.john@example.com") |
| `alert_type` | TEXT | NOT NULL, CHECK(...IN('off_hours_access', 'mass_data_export', 'privilege_escalation', 'unusual_tcode', 'transport_anomaly')) | Alert classification |
| `description` | TEXT | NOT NULL | Human-readable alert description |
| `severity` | TEXT | NOT NULL, CHECK(...IN('low', 'medium', 'high', 'critical')) | Alert severity (derived from risk_score) |
| `risk_score` | INTEGER | NOT NULL, CHECK(... BETWEEN 0 AND 100) | Anomaly risk score (0-100) |
| `status` | TEXT | NOT NULL, DEFAULT('open'), CHECK(...IN('open', 'investigating', 'cleared', 'escalated')) | Investigation status |
| `investigation_notes` | TEXT | NULL | Notes from security analyst investigation |
| `occurred_at` | INTEGER | NOT NULL | When the anomalous event occurred |

### 4.8 Agent Ledger Table (AGL Results)

**Purpose:** Immutable audit trail of autonomous AI agent actions. One row = one agent execution.

| Column | Type | Constraints | Description |
|--------|------|-----------|------------|
| `id` | TEXT | PRIMARY KEY | UUID v4 (e.g., "agl-ledger-20250419-001") |
| `project_id` | TEXT | FOREIGN KEY → projects.id | Project the agent acted upon |
| `agent_name` | TEXT | NOT NULL | AI agent name (e.g., "RoleSegregationFixer") |
| `agent_version` | TEXT | NOT NULL | Agent version at execution time (e.g., "1.2.1") |
| `triggering_user` | TEXT | NOT NULL | User who approved/triggered the agent action |
| `action_type` | TEXT | NOT NULL, CHECK(...IN('modify_role', 'create_user', 'deploy_transport', 'fix_code', 'mask_data')) | Action performed |
| `target_object` | TEXT | NOT NULL | SAP object affected (e.g., "ZFIAP_MANAGER", "ZBAPI_READER") |
| `target_system` | TEXT | NOT NULL | SAP system ID where action occurred (e.g., "SID_PRD_S4H") |
| `data_fields_accessed` | TEXT | NOT NULL | JSON array of fields accessed (e.g., `["AGR_1251.AGRT", "AGR_USERS.MANDT"]`) |
| `intended_outcome` | TEXT | NOT NULL | Agent's intended result |
| `execution_status` | TEXT | NOT NULL, CHECK(...IN('success', 'partial_success', 'failed', 'rolled_back')) | Execution result |
| `records_affected` | INTEGER | DEFAULT(0) | Number of records modified |
| `risk_level` | TEXT | NOT NULL, CHECK(...IN('low', 'medium', 'high', 'critical')) | Risk classification of the action |
| `hash` | TEXT | NOT NULL | SHA-256 hash of ledger entry (for tamper detection) |
| `hash_parent` | TEXT | NULL | Hash of previous ledger entry (chain link) |
| `executed_at` | INTEGER | NOT NULL | When agent executed this action |

**Schema constraint:** All ledger entries are append-only. The `executed_at` timestamp and `hash` uniquely identify each entry and prevent modification.

---

## 5. API Reference

### Overview

Digital Shield exposes **15 REST endpoints** through Express.js running on `http://localhost:3001/api`. All endpoints require JWT authentication (except `/auth/login`). All responses are JSON-formatted with consistent error handling.

### 5.1 Endpoint Summary

| Method | Endpoint | Auth Required | Role | Description |
|--------|----------|---------------|------|------------|
| POST | `/auth/login` | No | N/A | User login, returns JWT token |
| GET | `/auth/me` | Yes | Any | Current user profile |
| GET | `/projects/:id` | Yes | Any | Fetch project metadata |
| GET | `/projects/:id/auth-findings` | Yes | Any | List all AIE authorization findings |
| PATCH | `/projects/:id/auth-findings/:fid` | Yes | ciso, analyst | Update AIE finding status |
| GET | `/projects/:id/code-findings` | Yes | Any | List all SCG code vulnerabilities |
| GET | `/projects/:id/data-findings` | Yes | Any | List all TDSL PII findings |
| PATCH | `/projects/:id/data-findings/:did/mask` | Yes | ciso, analyst | Approve/execute data masking |
| GET | `/projects/:id/compliance` | Yes | Any | Fetch CPM compliance scorecard |
| PATCH | `/projects/:id/compliance/:cid` | Yes | ciso, analyst | Update compliance control status |
| GET | `/projects/:id/behavioral-alerts` | Yes | Any | List all BAS alerts |
| PATCH | `/projects/:id/behavioral-alerts/:aid/status` | Yes | analyst | Update alert investigation status |
| GET | `/projects/:id/agent-ledger` | Yes | Any | Query AGL ledger entries |
| GET | `/projects/:id/agent-ledger/export` | Yes | ciso, auditor | Export ledger as JSON for external audit |
| POST | `/ai/analyze` | Yes | analyst, ciso | Request AI-enriched security analysis |

### 5.2 Authentication Endpoints

#### POST /auth/login

**Description:** Authenticate user with email/password. Returns JWT token.

**Request:**
```json
{
  "email": "ciso@demo.com",
  "password": "Shield@2025"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr-20250419-001",
    "email": "ciso@demo.com",
    "name": "Chief Information Security Officer",
    "role": "ciso",
    "project_id": "proj-20250419-001"
  }
}
```

#### GET /auth/me

**Description:** Fetch current authenticated user profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": "usr-20250419-001",
  "email": "ciso@demo.com",
  "name": "Chief Information Security Officer",
  "role": "ciso",
  "project_id": "proj-20250419-001",
  "last_login": "2025-04-19T14:30:00Z"
}
```

### 5.3 Project & Finding Endpoints

#### GET /api/projects/:id

**Description:** Fetch project metadata (risk score, compliance score, phase).

**Response (200 OK):**
```json
{
  "id": "proj-20250419-001",
  "name": "Global S/4 Migration - Phase 2",
  "client": "100",
  "source_system": "ECC 6.0 PRD",
  "target_system": "S/4HANA 2023 PRD",
  "phase": "build",
  "overall_risk_score": 72,
  "compliance_score": 65,
  "go_live_date": "2025-09-15T00:00:00Z"
}
```

#### GET /api/projects/:id/auth-findings

**Description:** List AIE findings (SoD violations). Supports pagination.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `severity` (optional: filter by "critical", "high", "medium", "low")
- `status` (optional: filter by "open", "in_remediation", "remediated")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "aie-sod-001",
      "finding_type": "segregation_of_duties_violation",
      "severity": "critical",
      "role_name": "ZFIAP_MANAGER",
      "tcode_1": "FB60",
      "tcode_2": "F110",
      "user_count": 12,
      "status": "open",
      "remediation_plan": "Split role into ZFIAP_CREATOR and ZFIAP_APPROVER...",
      "detected_at": "2025-04-18T08:30:00Z"
    }
  ],
  "meta": {
    "total": 18,
    "page": 1,
    "limit": 20,
    "pages": 1
  }
}
```

#### GET /api/projects/:id/code-findings

**Description:** List SCG code vulnerabilities.

**Query Parameters:**
- `page` (default: 1), `limit` (default: 20)
- `severity` (optional)
- `finding_type` (optional: "missing_auth_check", "hardcoded_credential", "sql_injection", "rfc_abuse", "open_cursor")

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "scg-auth-001",
      "object_name": "ZRFQ_CREATION",
      "object_type": "program",
      "finding_type": "missing_auth_check",
      "severity": "high",
      "line_number": 42,
      "code_snippet": "CALL TRANSACTION 'ME41' ...",
      "cvss_score": 8.2,
      "cwe_id": "CWE-250",
      "status": "open",
      "ai_fix": "AUTHORITY-CHECK OBJECT 'ME' ID 'ACTVT' FIELD '01'...",
      "detected_at": "2025-04-18T10:15:00Z"
    }
  ],
  "meta": { "total": 28, "page": 1 }
}
```

### 5.4 AI Analysis Endpoint

#### POST /api/ai/analyze

**Description:** Request AI-enriched analysis for a finding. Calls OpenAI o4-mini or o3 based on analysis mode.

**Request:**
```json
{
  "mode": "remediation_plan",
  "context": {
    "finding_id": "aie-sod-001",
    "finding_type": "segregation_of_duties_violation",
    "details": {
      "tcode_1": "FB60",
      "tcode_2": "F110",
      "affected_roles": ["ZFIAP_MANAGER"],
      "affected_users": 12
    }
  }
}
```

**Supported modes:**
- `ciso_brief` (o4-mini) — 3-bullet executive summary
- `remediation_plan` (o3) — Detailed step-by-step remediation
- `code_fix` (o4-mini) — ABAP code rewrite
- `data_risk` (o4-mini) — PII exposure assessment
- `audit_evidence` (o3) — Formal compliance narrative
- `behavioral_risk` (o4-mini) — Insider threat assessment
- `explain_agent_action` (o4-mini) — AI explanation of agent action

**Response (200 OK):**
```json
{
  "analysis": "• **Immediate (Week 1):** Create new segregated roles ZFIAP_CREATOR (FB60 only) and ZFIAP_APPROVER (F110 only). Notify all 12 affected users of role change. Rationale: Prevent any single user from creating AND approving vendor payments.\n• **Short-term (Week 2-3):** Audit VEND and BSEG tables for suspicious transactions created by users with both roles. No anomalies detected in test system. Prepare to redeploy roles to production.\n• **Long-term:** Implement automated SoD monitoring post-go-live using Digital Shield's continuous AIE scanning.",
  "mode": "remediation_plan",
  "model": "o3",
  "tokens_used": 1247,
  "cost_estimate_usd": 0.06
}
```

---

## 6. AI Intelligence Engine

### 6.1 Model Selection Rationale

Digital Shield uses two OpenAI models strategically:

**OpenAI o4-mini** (Standard Analysis)
- Use for: Fast, cost-effective analysis where detailed reasoning isn't required
- Cost: ~$0.00015 per 1k tokens input, ~$0.0006 per 1k tokens output
- Speed: ~2-3 seconds response time
- Modes: ciso_brief, code_fix, data_risk, behavioral_risk, explain_agent_action

**OpenAI o3** (Complex Reasoning)
- Use for: Multi-step reasoning, legal/compliance narratives, long-form remediation planning
- Cost: ~$0.001 per 1k tokens input, ~$0.004 per 1k tokens output (20x more expensive)
- Speed: ~5-10 seconds response time
- Modes: remediation_plan, audit_evidence

**Cost optimization:** Roughly 80% of analysis requests use o4-mini. Only remediation_plan and audit_evidence (high-value outputs) justify o3's cost premium.

### 6.2 AI Analysis Modes

| Mode | Model | Module | Purpose | Example Output |
|------|-------|--------|---------|-----------------|
| `ciso_brief` | o4-mini | AIE, SCG, TDSL, CPM, BAS, VSE | 3-bullet executive summary for CISO dashboard | "• **Critical Risk (72/100)**: 25 SoD violations..." |
| `remediation_plan` | o3 | AIE, TDSL, CPM | Detailed step-by-step remediation plan with timeline | "Week 1: Split roles. Week 2: Audit. Week 3: Deploy..." |
| `code_fix` | o4-mini | SCG | Secure ABAP code rewrite with security annotations | "AUTHORITY-CHECK OBJECT 'ME'..." |
| `data_risk` | o4-mini | TDSL | PII exposure risk assessment with regulation refs | "15 unmasked PII fields violate GDPR Art. 32..." |
| `audit_evidence` | o3 | CPM, BAS | Formal compliance narrative for external auditors | "This project demonstrates control CC6.1 compliance via..." |
| `behavioral_risk` | o4-mini | BAS | Insider threat assessment with investigation steps | "Risk score 85/100. Recommend: Review access logs..." |
| `explain_agent_action` | o4-mini | AGL | Plain-English summary of agent action in ledger | "Agent RoleSegregationFixer removed T-code FB60 from role ZFIAP_MANAGER..." |

### 6.3 o-Series Model Constraints

**CRITICAL:** OpenAI's o-series models (o4-mini, o3) have unique constraints:

| Constraint | Implication | Implementation |
|-----------|-------------|-----------------|
| **No temperature parameter** | Cannot adjust randomness; always deterministic | DO NOT pass `temperature` in API call |
| **Must use max_completion_tokens** | Must always set upper bound on response length | Set `max_completion_tokens: 1500` for standard, `2000` for complex |
| **Fixed thinking budget** | Model allocates internal reasoning time; cannot override | Accept default thinking budget |
| **No streaming** | Response arrives as a single complete message | Use non-streaming API call |
| **Higher latency** | Expect 5-10 second response time (vs. 1-2 for GPT-4) | Async handling required in frontend |

### 6.4 Model Comparison

| Model | Cost per 1M tokens In | Cost per 1M tokens Out | Use Case | Speed |
|-------|----------------------|----------------------|----------|-------|
| o4-mini | $0.15 | $0.60 | Fast, cost-effective analysis | 2-3s |
| o3 | $1.00 | $4.00 | Complex reasoning, compliance docs | 5-10s |
| GPT-4o | $5.00 | $15.00 | Replaced by o4-mini; don't use | 1-2s |

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy

| Component | Purpose | Children | State Management |
|-----------|---------|----------|------------------|
| `<App />` | Root router, layout wrapper | All page routes | Zustand (global auth) |
| `<Dashboard />` | Executive risk overview | RiskScoreCard, ComplianceScoreCard, FindingsChart, AIInsightPanel | useSecurityData hook |
| `<AuthorizationIntelligence />` | AIE module (SoD findings) | FindingsList, RiskHeatmap, RemediationWorkflow | useAIAnalysis hook |
| `<SecureCodeGuardian />` | SCG module (code vulnerabilities) | CodeFindingsList, CVSSChart, AICodeFixPanel | useAIAnalysis hook |
| `<TestDataSovereignty />` | TDSL module (PII masking) | DataFindingsList, MaskingWorkflow, ComplianceMap | useAIAnalysis hook |
| `<CompliancePosture />` | CPM module (compliance scorecard) | ComplianceControlsTable, TrendChart, AuditEvidenceExport | useAIAnalysis hook |
| `<BehavioralSentinel />` | BAS module (insider threat) | AlertsList, UserHeatmap, InvestigationPanel | useAIAnalysis hook |
| `<AgentLedger />` | AGL module (agent audit trail) | LedgerTable, HashVerification, LedgerExport | useAIAnalysis hook |
| `<AIInsightPanel />` | Renders AI analysis with formatting | Copy button, code highlighting, markdown rendering | Props (analysis string) |

### 7.2 State Management (Zustand)

```typescript
// Global auth store
const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (token, user) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));

// Module-level security data store
const useSecurityStore = create((set) => ({
  findings: [],
  selectedFinding: null,
  isLoading: false,
  fetchFindings: async (projectId) => { /* axios call */ },
  selectFinding: (finding) => set({ selectedFinding: finding }),
}));
```

### 7.3 Custom Hooks

| Hook | Purpose | Returns |
|------|---------|---------|
| `useAIAnalysis()` | Call /api/ai/analyze, handle loading/error | { analysis, isLoading, error } |
| `useSecurityData()` | Fetch findings from /api/projects/:id/...-findings | { findings, total, page, isLoading } |
| `useComplianceStatus()` | Fetch compliance scorecard from CPM | { score, controls, trending } |
| `useAuthCheck()` | Verify JWT validity, redirect to login if expired | { isAuthenticated, user, role } |

### 7.4 Design Tokens

| Token | Value (HEX) | Usage |
|-------|------------|-------|
| Navy (Primary) | #0F172A | Headings, navigation, sidebar |
| Purple (Accent) | #6C3BFF | H3 subheadings, CTA buttons, accent borders |
| Critical (Red) | #EF4444 | Critical severity badges, error states |
| High (Orange) | #F97316 | High severity badges, warnings |
| Success (Green) | #22C55E | Low severity, compliant status, success messages |
| Info (Blue) | #1E3A8A | Information panels, tips, learning content |

---

## 8. KTern Integration Map

| KTern Module | DS Engine | Integration Point | How It Works | Business Value |
|--------------|-----------|-------------------|------------|-----------------|
| **Digital Maps** | AIE, SCG | Landscape discovery API | Role object export from legacy system → AIE ingests for SoD analysis; ABAP code metadata → SCG analyzes | Transform uncontrolled role migration into validated, conflict-free role deployment |
| **Digital Labs** | SCG, TDSL | Code quality gate + test data interception | Z-namespace code uploaded for testing → SCG security scan + TDSL PII intercept before test data enters sandbox | Zero-risk test cycles: secure code + masked data guarantee compliance before go-live |
| **Digital Projects** | CPM | Milestone tracking API | Project phase updates trigger compliance scorecard refresh; real-time control status feeds project dashboard | CISO visibility into security trajectory week-by-week, not post-go-live scramble |
| **Digital Mines** | BAS | DevOps telemetry + SAP audit stream | Agent deployment events + SM20 security log streamed to BAS for behavioral anomaly scoring | Catch insider threats during highest-risk 12-18 month transformation window in real-time |
| **AI Agent Space** | AGL | Agent orchestration wrapper | Every KTern AI Agent action pre-wrapped with AGL context capture before and post-execution | CISO can confidently delegate autonomous SAP operations with immutable audit trail |

---

## 9. Local Setup & Deployment

### 9.1 Prerequisites

- **Node.js 18.x+** — https://nodejs.org/
- **npm 9.x+** (included with Node)
- **SQLite3** (included with better-sqlite3 package, no external install needed)
- **Git** — for cloning the repo
- **OpenAI API Key** — https://platform.openai.com/api-keys (with o4-mini/o3 access)

### 9.2 Quick Start (Local Development)

1. **Clone & navigate:**
   ```bash
   git clone https://github.com/ktern-ai/digital-shield.git
   cd digital-shield
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file** in project root:
   ```
   OPENAI_API_KEY=sk-svcacct-xxxxx
   JWT_SECRET=your-secret-key-here
   NODE_ENV=development
   ```

4. **Start full stack:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - API Docs: http://localhost:3001/api

6. **Login:**
   - Email: `ciso@demo.com`
   - Password: `Shield@2025`

### 9.3 npm Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend (Vite:5173) + backend (Express:3001) concurrently |
| `npm run build` | Build frontend bundle for production |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Jest test suite |
| `npm run lint` | ESLint + Prettier code quality check |
| `npm run seed` | Seed database with 140+ demo records |

### 9.4 Production Migration Path

**From SQLite to PostgreSQL:**

1. **Update connection string:**
   ```typescript
   // backend/src/database/connection.ts
   // Change from: import Database from 'better-sqlite3'
   // To: import { Pool } from 'pg'
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL
     // e.g. postgres://user:pass@host:5432/digital-shield
   });
   ```

2. **Run schema migrations:**
   ```bash
   npm run migrate:prod
   ```

3. **Seed production data:**
   ```bash
   npm run seed:prod
   ```

4. **Deploy backend to cloud:**
   - AWS Lambda / ECS (Node.js runtime)
   - or Docker container (Dockerfile included)
   - or managed platforms (Heroku, Railway, Render)

5. **Deploy frontend:**
   - Build static bundle: `npm run build`
   - Upload to S3 + CloudFront
   - or deploy to Vercel, Netlify

---

## 10. Security Considerations

### 10.1 Authentication & Authorization

- **JWT tokens** expire after 24 hours; refresh token stored in httpOnly cookie
- **Password hashing** uses bcrypt with 12-round salt (never store plaintext)
- **Role-based access control (RBAC)** enforced at API gateway middleware level
- **CORS** configured to allow only registered frontend URLs (no wildcard)
- **All endpoints** require Bearer token except `/auth/login`

### 10.2 Data Protection

- **SQLite at rest** — Encrypted using SQLCipher (production: PostgreSQL with TLS 1.3)
- **API responses** — Always JSON, never HTML (prevents XSS)
- **Sensitive data in logs** — Never logged (no passwords, API keys, user data)
- **Database backups** — Automated daily, stored in encrypted S3 bucket
- **PII handling** — TDSL masks before data enters test systems; never transmitted plaintext

### 10.3 OpenAI API Security

- **API key** stored in environment variable (never in code/git)
- **API key rotation** every 90 days (set calendar reminder)
- **Rate limiting** — Max 10 AI requests per minute per user
- **Prompt injection protection** — User inputs sanitized before sending to OpenAI
- **Response validation** — OpenAI responses parsed strictly; unexpected JSON structure rejected

---

## 11. Roadmap

| Phase | Timeline | Deliverables |
|-------|----------|--------------|
| **MVP** | 0-4 months | 7 security engines (AIE, SCG, TDSL, CPM, BAS, AGL, VSE) · REST API · Web UI · SQLite database |
| **v1.0 Integration** | 4-9 months | Integrate with KTern Digital Maps, Labs, Projects, Mines · Compliance automation · Multi-project support |
| **v1.1 Automation** | 9-14 months | Auto-remediation workflows · Batch masking · Scheduled scanning · Email notifications |
| **v2.0 Autonomous** | 14-24 months | AI-driven auto-remediation agent · Real-time threat response · Multi-tenant SaaS platform |

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **AGL** | Agent Governance Ledger — immutable audit trail for autonomous AI actions |
| **AIE** | Authorization Intelligence Engine — Segregation of Duties analysis engine |
| **BAS** | Behavioral Anomaly Sentinel — insider threat detection engine |
| **CPM** | Compliance Posture Mapper — real-time compliance scorecard engine |
| **CVSS** | Common Vulnerability Scoring System — standardized vulnerability scoring (0-10) |
| **CWE** | Common Weakness Enumeration — standardized software vulnerability taxonomy |
| **DXaaS** | Digital Transformation as a Service — KTern.AI's core platform |
| **DPDP** | Data Protection and Privacy Act 2023 — India's data protection regulation |
| **GDPR** | General Data Protection Regulation — EU data protection regulation (Art. 32 = data security) |
| **JWT** | JSON Web Token — stateless authentication mechanism |
| **PII** | Personally Identifiable Information — data that identifies an individual (name, email, SSN, etc.) |
| **RBAC** | Role-Based Access Control — permission system based on user roles (CISO, analyst, auditor) |
| **RFC** | Remote Function Call — SAP inter-system communication protocol |
| **SCG** | Secure Code Guardian — ABAP code vulnerability detection engine |
| **SoD** | Segregation of Duties — security principle: no single user has conflicting authorization |
| **SOX** | Sarbanes-Oxley Act — US public company governance law (ITGC = IT General Controls) |
| **TDSL** | Test Data Sovereignty Layer — PII detection and masking engine |
| **VSE** | Vulnerability Surface Engine — post-go-live vulnerability scanning and regression detection |
| **T-code** | Transaction code — SAP UI transaction identifier (e.g., FB60 = Create Vendor) |

---

End of Document

*Last updated: 2025-04-19*
*Classification: Confidential*
*For questions, contact: security@ktern.ai*





