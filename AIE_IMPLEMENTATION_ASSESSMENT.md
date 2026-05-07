# Authorization Intelligence Engine (AIE) - Implementation Assessment

**Date**: April 2026  
**Project**: Digital Shield - SAP Security Assessment Platform  
**Focus**: AIE Module - SoD (Segregation of Duties) Detection and CSV Data Processing

---

## Executive Summary

The AIE module has a **minimal implementation**. Currently it provides:
- ✅ Display of pre-seeded authorization findings
- ✅ Basic CRUD operations on findings (view, filter, update status)
- ✅ AI-powered remediation advice via OpenAI integration
- ❌ No CSV data ingestion capability
- ❌ No SoD detection algorithm
- ❌ No dynamic violation generation
- ❌ No data storage structures for AGR_USERS and AGR_1251

**Estimated effort to production-ready SoD detection**: **3-5 days** with the patterns already established in the codebase.

---

## Part 1: Current Implementation Analysis

### 1.1 Backend Routes (`server/src/routes/aie.routes.ts`)

**Current Endpoints:**

```typescript
// GET /api/projects/:id/auth-findings
// - Fetches findings for a project
// - Supports filters: severity, type, status, search
// - Returns array of AuthFinding objects
// - Pattern: Direct DB queries, no service layer

// PATCH /api/projects/:id/auth-findings/:fid
// - Updates finding status (open → in_review → remediated → accepted)
// - Requires roles: ciso, security_analyst
// - Returns updated finding
```

**Pattern Analysis:**
- Routes directly call `db.prepare().all()` or `.run()` 
- No service layer abstraction
- No CSV processing endpoints exist
- No detection/analysis endpoints

**Issues:**
- Business logic mixed with HTTP handlers
- No reusability for services
- Single responsibility violated

---

### 1.2 Database Schema (`server/src/db/schema.ts`)

**Current Tables (Relevant to AIE):**

```sql
CREATE TABLE auth_findings (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  finding_type TEXT CHECK (...'sod_violation'...),
  severity TEXT CHECK (...'critical', 'high', 'medium', 'low'),
  role_name TEXT NOT NULL,
  tcode_1 TEXT,                    -- First T-code in conflict pair
  tcode_2 TEXT,                    -- Second T-code in conflict pair
  user_count INTEGER,              -- How many users have this SoD violation
  description TEXT,
  remediation TEXT,
  status TEXT DEFAULT 'open',      -- open, in_review, remediated, accepted
  detected_at DATETIME
);
```

**What Exists:**
- Pre-seeded with 25 hardcoded findings
- Severity distribution: 6 critical, 10 high, 7 medium, 2 low
- T-code conflicts hardcoded (FB60/F110, ME21N/MIRO, VA01/VF01, etc.)
- User counts randomized (3-45 users per role)

**What's Missing:**
```sql
-- These tables needed for CSV upload and detection:
CREATE TABLE agr_users (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  mandt TEXT,           -- SAP Client
  uname TEXT,           -- User name
  ags_role_name TEXT,   -- Role name (from AGR_USERS)
  ags_role_ext TEXT,    -- Extended role info
  uploaded_at DATETIME
);

CREATE TABLE agr_1251 (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  mandt TEXT,
  ags_role_name TEXT,   -- Role name (from AGR_1251)
  tcode TEXT,           -- Transaction code
  auth_object TEXT,     -- Authorization object
  auth_values TEXT,     -- Field values (serialized JSON)
  uploaded_at DATETIME
);

CREATE TABLE sod_rules (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  rule_name TEXT,
  tcode_pair TEXT,      -- "FB60,F110" format
  description TEXT,
  severity TEXT,        -- The severity if this pair is found
  created_at DATETIME
);

CREATE TABLE sod_violations (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  sod_rule_id TEXT,
  role_name TEXT,
  tcode_1 TEXT,
  tcode_2 TEXT,
  affected_users TEXT,  -- JSON array of usernames
  violation_count INT,  -- Number of users with this violation
  severity TEXT,
  detected_at DATETIME,
  FOREIGN KEY(sod_rule_id) REFERENCES sod_rules(id)
);
```

---

### 1.3 Data Types (`server/src/types/index.ts`)

**Current AIE Types:**

```typescript
export type FindingType = 'sod_violation' | 'privileged_access' | 'orphaned_role' | 'critical_auth';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type FindingStatus = 'open' | 'in_review' | 'remediated' | 'accepted';

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
```

**Missing Types:**

```typescript
// CSV input types
export interface AgrUsersRow {
  MANDT: string;        // SAP Client
  UNAME: string;        // Username
  AGS_ROLE_NAME: string;// Role name
}

export interface Agr1251Row {
  MANDT: string;
  AGS_ROLE_NAME: string;
  TCODE: string;
  AUTH_OBJECT?: string;
  FIELD?: string;
  VALUE?: string;
}

// Detection types
export interface SodRule {
  id: string;
  projectId: string;
  name: string;
  tcodePair: [string, string];  // [FB60, F110]
  description: string;
  riskLevel: Severity;
}

export interface SodViolation {
  id: string;
  projectId: string;
  ruleId: string;
  roleName: string;
  tcodePair: [string, string];
  affectedUsers: string[];      // List of usernames
  severity: Severity;
  detectedAt: Date;
}

export interface DetectionResult {
  projectId: string;
  uploadedUsers: number;
  scannedRoles: number;
  violationsFound: number;
  violationsBySeverity: Record<Severity, number>;
  violations: SodViolation[];
  detectionRunId: string;
  executedAt: Date;
  durationMs: number;
}
```

---

### 1.4 Frontend Component (`client/src/pages/AuthorizationIntelligence.tsx`)

**Current Features:**

```typescript
export default function AuthorizationIntelligence() {
  // State:
  // - findings: AuthFinding[] (fetched from API)
  // - selectedFinding: AuthFinding | null (for detail panel)
  // - loading: boolean

  // UI Sections:
  // 1. Stats cards (hardcoded values):
  //    - Roles Scanned: 42 (hardcoded)
  //    - SoD Violations: computed from findings
  //    - Privileged Users: computed from findings
  //    - Orphaned Roles: computed from findings

  // 2. Authorization Findings table
  //    - Columns: Role, Type, T-Code Conflict, Severity, Users, Status
  //    - Features: sortable, searchable, clickable rows

  // 3. Finding Details panel (right sidebar)
  //    - Shows selected finding details
  //    - "AI Remediation Plan" button
  //    - AIInsightPanel component displays GPT response

  // 4. Likelihood vs Impact scatter chart
  //    - X-axis: Likelihood (based on finding index)
  //    - Y-axis: Impact (based on severity)
  //    - Colored dots per severity level

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {/* DataTable with findings */}
      {/* Finding details panel */}
      {/* Scatter chart */}
    </div>
  );
}
```

**Missing Features:**

1. ❌ File upload UI component
2. ❌ CSV file picker
3. ❌ Upload progress indicator
4. ❌ SoD analysis trigger button
5. ❌ Dynamic stats (currently hardcoded "42 roles")
6. ❌ User list expandable for each violation
7. ❌ Upload history/timeline
8. ❌ Detection run status

**Existing Reusable Components:**

- `DataTable<T>` - Generic table with sorting, searching, row selection
- `SeverityBadge` - Renders severity with color coding
- `AIInsightPanel` - Displays AI analysis results
- `useAIAnalysis` - Hook for calling AI analysis endpoint

---

### 1.5 Backend Architecture Patterns

**Pattern 1: Direct Route Handler (Current AIE)**
```typescript
router.get('/projects/:id/auth-findings', verifyAuth, (req, res) => {
  let query = 'SELECT * FROM auth_findings WHERE project_id = ?';
  if (severity) query += ' AND severity = ?';
  // ... more conditions
  const findings = db.prepare(query).all(...params);
  res.json(findings);
});
```

**Pattern 2: Service Layer (Used in OpenAI)**
```typescript
// services/openai.service.ts
function buildPrompts(mode: AnalysisMode, context: unknown): AnalysisPrompts {
  // Returns { systemPrompt, userPrompt, useComplexModel }
}

export async function analyzeContext(mode, context) {
  const { systemPrompt, userPrompt } = buildPrompts(mode, context);
  // Calls OpenAI API
}
```

**Pattern 3: Middleware (Auth)**
```typescript
export function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
}
```

**Recommendation**: Adopt service layer pattern for SoD processing (like OpenAI service).

---

## Part 2: What Needs to Be Built

### 2.1 Backend: New Service Layer

**File: `server/src/services/sod.service.ts`**

Required functions:

```typescript
/**
 * Parse CSV file for AGR_USERS data
 * Format: MANDT | UNAME | AGS_ROLE_NAME
 */
export function parseAgrUsers(csvContent: string): AgrUsersRow[] {
  // Split by newlines, skip header, parse each row
  // Validate required fields
  // Return array of AgrUsersRow
}

/**
 * Parse CSV file for AGR_1251 data
 * Format: MANDT | AGS_ROLE_NAME | TCODE | AUTH_OBJECT | ...
 */
export function parseAgr1251(csvContent: string): Agr1251Row[] {
  // Similar to parseAgrUsers
}

/**
 * Store parsed data in database
 */
export function storeAgrData(projectId: string, users: AgrUsersRow[], tcodes: Agr1251Row[]): {
  usersStored: number;
  tcodesStored: number;
  timestamp: string;
}

/**
 * Load SoD rules from database or hardcoded defaults
 */
export function loadSodRules(projectId: string): SodRule[] {
  // Return array of SodRule objects
  // Can come from DB or use defaults if none defined
}

/**
 * Execute SoD conflict detection
 * Compare user roles against T-code access rules
 */
export function detectSodViolations(
  projectId: string,
  agrUsers: AgrUsersRow[],
  agr1251: Agr1251Row[],
  sodRules: SodRule[]
): DetectionResult {
  // 1. Build role → T-codes map from agr1251
  // 2. For each rule [tcode1, tcode2]:
  //    - Find users who have access to BOTH tcodes
  //    - Create SodViolation for each user/role combo
  // 3. Calculate severity based on user count and rule risk level
  // 4. Return summary
}

/**
 * Generate auth_findings records from detected violations
 */
export function createAuthFindings(
  projectId: string,
  violations: SodViolation[]
): void {
  // For each unique role+tcode_pair:
  //   - Create one auth_finding (not one per user)
  //   - Set user_count to number of affected users
  //   - Link affected users in description or separate table
}
```

---

### 2.2 Backend: New Endpoints

**File: `server/src/routes/aie.routes.ts` (additions)**

```typescript
/**
 * POST /api/projects/:id/agr-data/upload
 * Upload AGR_USERS and AGR_1251 CSV files
 * 
 * Request: multipart/form-data
 *   - agr_users: File
 *   - agr_1251: File
 * 
 * Response:
 *   {
 *     "uploadId": "uuid",
 *     "projectId": "uuid",
 *     "usersIngested": 1250,
 *     "rolesProcessed": 42,
 *     "tcodesProcessed": 289,
 *     "timestamp": "2026-04-21T10:30:00Z"
 *   }
 */
router.post('/projects/:id/agr-data/upload', verifyAuth, requireRole('ciso', 'security_analyst'), 
  upload.fields([
    { name: 'agr_users', maxCount: 1 },
    { name: 'agr_1251', maxCount: 1 }
  ]),
  async (req, res) => {
    // Parse files
    // Store in DB
    // Return summary
  }
);

/**
 * POST /api/projects/:id/sod-detection/run
 * Execute SoD conflict detection
 * 
 * Request:
 *   {
 *     "uploadId": "uuid",  // From upload endpoint
 *     "sodRuleSetId": "uuid" // Optional, uses defaults if omitted
 *   }
 * 
 * Response:
 *   {
 *     "detectionRunId": "uuid",
 *     "status": "processing|completed|failed",
 *     "violationsFound": 87,
 *     "bySeverity": {
 *       "critical": 12,
 *       "high": 35,
 *       "medium": 28,
 *       "low": 12
 *     },
 *     "executedAt": "...",
 *     "durationMs": 1234
 *   }
 */
router.post('/projects/:id/sod-detection/run', verifyAuth, requireRole('ciso', 'security_analyst'),
  async (req, res) => {
    // Load AGR data
    // Load SoD rules
    // Execute detection
    // Create auth_findings records
    // Return results
  }
);

/**
 * GET /api/projects/:id/sod-violations
 * Fetch detected SoD violations
 * 
 * Query params:
 *   - uploadId: string (optional, filter by upload session)
 *   - detectionRunId: string (optional)
 *   - severity: 'critical' | 'high' | 'medium' | 'low'
 *   - role: string (exact role name filter)
 *   - tcodePair: string format "FB60,F110"
 * 
 * Response: Array<SodViolation>
 */
router.get('/projects/:id/sod-violations', verifyAuth, (req, res) => {
  // Query sod_violations table with filters
  // Return results
});

/**
 * GET /api/projects/:id/agr-uploads
 * List all AGR data uploads for a project
 * 
 * Response:
 *   Array<{
 *     "uploadId": string,
 *     "uploadedAt": string,
 *     "usersCount": number,
 *     "rolesCount": number,
 *     "tcodesCount": number,
 *     "detectionStatus": "pending|completed|failed"
 *   }>
 */
router.get('/projects/:id/agr-uploads', verifyAuth, (req, res) => {
  // Query agr upload history
});
```

---

### 2.3 Database Schema Extensions

New tables to add to `server/src/db/schema.ts`:

```sql
-- Store AGR_USERS data from uploads
CREATE TABLE agr_users (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  upload_session_id TEXT NOT NULL,
  mandt TEXT,
  uname TEXT NOT NULL,
  ags_role_name TEXT NOT NULL,
  ags_role_ext TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Store AGR_1251 data from uploads
CREATE TABLE agr_1251 (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  upload_session_id TEXT NOT NULL,
  mandt TEXT,
  ags_role_name TEXT NOT NULL,
  tcode TEXT NOT NULL,
  auth_object TEXT,
  auth_values TEXT,  -- JSON serialized
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Track upload sessions
CREATE TABLE agr_upload_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  uploaded_by TEXT,        -- user_id
  agr_users_count INTEGER,
  agr_1251_count INTEGER,
  upload_status TEXT,      -- success|partial|failed
  error_message TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- SoD Rules library
CREATE TABLE sod_rules (
  id TEXT PRIMARY KEY,
  project_id TEXT,        -- NULL means shared/default
  rule_name TEXT NOT NULL,
  tcode_1 TEXT NOT NULL,
  tcode_2 TEXT NOT NULL,
  conflict_type TEXT,     -- fraud, compliance_breach, etc.
  description TEXT,
  baseline_severity TEXT, -- critical|high|medium|low
  created_at DATETIME,
  created_by TEXT
);

-- Detected SoD violations
CREATE TABLE sod_violations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  detection_run_id TEXT,
  sod_rule_id TEXT,
  role_name TEXT NOT NULL,
  tcode_1 TEXT NOT NULL,
  tcode_2 TEXT NOT NULL,
  affected_users TEXT,    -- JSON array: ["USER1", "USER2"]
  violation_count INTEGER,-- Number of affected users
  severity TEXT,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Track detection runs
CREATE TABLE sod_detection_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  upload_session_id TEXT NOT NULL,
  initiated_by TEXT,      -- user_id
  status TEXT,            -- processing|completed|failed
  total_users_scanned INTEGER,
  roles_analyzed INTEGER,
  violations_detected INTEGER,
  severity_distribution TEXT, -- JSON: {"critical": 12, "high": 35, ...}
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INTEGER,
  FOREIGN KEY(project_id) REFERENCES projects(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_agr_users_project ON agr_users(project_id);
CREATE INDEX idx_agr_users_upload ON agr_users(upload_session_id);
CREATE INDEX idx_agr_1251_project ON agr_1251(project_id);
CREATE INDEX idx_agr_1251_role ON agr_1251(ags_role_name);
CREATE INDEX idx_sod_violations_project ON sod_violations(project_id);
CREATE INDEX idx_sod_violations_role ON sod_violations(role_name);
CREATE INDEX idx_sod_detection_runs_project ON sod_detection_runs(project_id);
```

---

### 2.4 Frontend: Upload Component

**File: `client/src/components/modules/AgrDataUpload.tsx` (new)**

```typescript
import { useState } from 'react';
import axios from 'axios';
import { useSecurityStore } from '../../store/securityStore.js';

export function AgrDataUpload() {
  const { user } = useSecurityStore();
  const [agrUsersFile, setAgrUsersFile] = useState<File | null>(null);
  const [agr1251File, setAgr1251File] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!agrUsersFile || !agr1251File) {
      setError('Please select both AGR_USERS and AGR_1251 files');
      return;
    }

    const formData = new FormData();
    formData.append('agr_users', agrUsersFile);
    formData.append('agr_1251', agr1251File);

    setUploading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const projectId = localStorage.getItem('project_id');
      
      const res = await axios.post(
        `/api/projects/${projectId}/agr-data/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setUploadResult(res.data);
      setAgrUsersFile(null);
      setAgr1251File(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Upload AGR Data</h3>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm text-gray-400 block mb-2">AGR_USERS (CSV)</label>
          <input 
            type="file"
            accept=".csv"
            onChange={(e) => setAgrUsersFile(e.target.files?.[0] || null)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-2">AGR_1251 (CSV)</label>
          <input 
            type="file"
            accept=".csv"
            onChange={(e) => setAgr1251File(e.target.files?.[0] || null)}
            disabled={uploading}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !agrUsersFile || !agr1251File}
          className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white font-semibold rounded disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload & Analyze'}
        </button>

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-700 rounded text-sm text-red-200">
            {error}
          </div>
        )}

        {uploadResult && (
          <div className="p-3 bg-green-900/50 border border-green-700 rounded text-sm text-green-200 space-y-1">
            <p>✓ Upload successful (ID: {uploadResult.uploadId})</p>
            <p>• Users ingested: {uploadResult.usersIngested}</p>
            <p>• Roles found: {uploadResult.rolesProcessed}</p>
            <p>• T-codes: {uploadResult.tcodesProcessed}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 2.5 Frontend: Detection Trigger & Results

**File: `client/src/components/modules/SodDetectionPanel.tsx` (new)**

```typescript
import { useState } from 'react';
import axios from 'axios';

export function SodDetectionPanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunDetection = async () => {
    setRunning(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const projectId = localStorage.getItem('project_id');

      const res = await axios.post(
        `/api/projects/${projectId}/sod-detection/run`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Detection failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-white">Run SoD Detection</h3>

      <button
        onClick={handleRunDetection}
        disabled={running}
        className="w-full px-4 py-2 bg-shield-accent hover:bg-purple-500 text-white font-semibold rounded disabled:opacity-50"
      >
        {running ? 'Analyzing...' : 'Analyze for SoD Conflicts'}
      </button>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 p-4 bg-slate-800 rounded border border-slate-700">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Violations Found</p>
              <p className="text-2xl font-bold text-shield-accent">{result.violationsFound}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Scan Duration</p>
              <p className="text-sm font-mono">{result.durationMs}ms</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-red-900/30 rounded">
              <p className="text-xs text-red-300">Critical</p>
              <p className="text-lg font-bold text-red-400">{result.bySeverity.critical}</p>
            </div>
            <div className="p-2 bg-orange-900/30 rounded">
              <p className="text-xs text-orange-300">High</p>
              <p className="text-lg font-bold text-orange-400">{result.bySeverity.high}</p>
            </div>
            <div className="p-2 bg-yellow-900/30 rounded">
              <p className="text-xs text-yellow-300">Medium</p>
              <p className="text-lg font-bold text-yellow-400">{result.bySeverity.medium}</p>
            </div>
            <div className="p-2 bg-green-900/30 rounded">
              <p className="text-xs text-green-300">Low</p>
              <p className="text-lg font-bold text-green-400">{result.bySeverity.low}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Part 3: Implementation Roadmap

### Phase 1: Backend Foundation (1 day)

1. ✅ Add new tables to `schema.ts`
2. ✅ Create `sod.service.ts` with parsing and detection logic
3. ✅ Extend `aie.routes.ts` with upload and detection endpoints
4. ✅ Add multer middleware for file uploads
5. ✅ Extend types in `types/index.ts`

**Deliverable**: Uploadable endpoints, detection logic working

---

### Phase 2: Frontend Components (1 day)

1. ✅ Create `AgrDataUpload.tsx` component
2. ✅ Create `SodDetectionPanel.tsx` component
3. ✅ Integrate both into `AuthorizationIntelligence.tsx` page
4. ✅ Update stats to be dynamic from detection results
5. ✅ Add user list expansion in violation table rows

**Deliverable**: Full UI for upload and SoD analysis

---

### Phase 3: Enhanced Visualization (1 day)

1. ✅ Add timeline of detection runs
2. ✅ Build violations dashboard with affected users per role
3. ✅ Add export/download findings as CSV
4. ✅ Integration with AI remediation for each violation

**Deliverable**: Rich visualization of SoD data

---

### Phase 4: Rules Management (1 day)

1. ✅ Build SoD ruleset editor
2. ✅ Support custom rule creation
3. ✅ Import standard SAP conflict rulesets (FFIS, MM, HR, FI, SD, etc.)
4. ✅ Rule versioning and audit trail

**Deliverable**: Rule management interface

---

### Phase 5: Production Hardening (1 day)

1. ✅ Add error recovery and retry logic
2. ✅ Bulk operation cancellation
3. ✅ Audit logging of all detection runs
4. ✅ Performance optimization for large datasets (10k+ users)
5. ✅ Data retention policies

**Deliverable**: Production-ready system

---

## Part 4: Code Patterns & Implementation Notes

### SoD Detection Algorithm (Pseudocode)

```typescript
function detectSodViolations(
  agrUsers: AgrUsersRow[],  // User→Role mappings
  agr1251: Agr1251Row[],    // Role→T-code mappings
  sodRules: SodRule[]       // Conflict rules
): SodViolation[] {
  // Step 1: Build role → T-codes lookup
  const roleToTcodes = new Map<string, Set<string>>();
  for (const row of agr1251) {
    if (!roleToTcodes.has(row.ags_role_name)) {
      roleToTcodes.set(row.ags_role_name, new Set());
    }
    roleToTcodes.get(row.ags_role_name)!.add(row.tcode);
  }

  // Step 2: Build user → roles lookup
  const userToRoles = new Map<string, Set<string>>();
  for (const row of agrUsers) {
    if (!userToRoles.has(row.uname)) {
      userToRoles.set(row.uname, new Set());
    }
    userToRoles.get(row.uname)!.add(row.ags_role_name);
  }

  // Step 3: Check each SoD rule
  const violations: SodViolation[] = [];
  for (const rule of sodRules) {
    const [tcode1, tcode2] = rule.tcodePair;

    // Find roles that have BOTH tcodes
    for (const [role, tcodes] of roleToTcodes.entries()) {
      if (tcodes.has(tcode1) && tcodes.has(tcode2)) {
        // Find users with this role
        const affectedUsers: string[] = [];
        for (const [user, roles] of userToRoles.entries()) {
          if (roles.has(role)) {
            affectedUsers.push(user);
          }
        }

        if (affectedUsers.length > 0) {
          violations.push({
            id: uuid(),
            projectId,
            ruleId: rule.id,
            roleName: role,
            tcodePair: [tcode1, tcode2],
            affectedUsers,
            severity: calculateSeverity(rule, affectedUsers.length),
            detectedAt: new Date()
          });
        }
      }
    }
  }

  return violations;
}

function calculateSeverity(rule: SodRule, userCount: number): Severity {
  // Base severity from rule
  let severity = rule.riskLevel;

  // Increase if affects many users
  if (userCount > 20) severity = 'critical';
  else if (userCount > 10 && severity !== 'critical') severity = 'high';

  return severity;
}
```

---

### CSV Parsing with Validation

```typescript
function parseAgrUsers(csvContent: string): AgrUsersRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split('|').map(h => h.trim());

  // Find column indices
  const mandtIdx = headers.indexOf('MANDT');
  const unameIdx = headers.indexOf('UNAME');
  const roleIdx = headers.indexOf('AGS_ROLE_NAME');

  if (mandtIdx < 0 || unameIdx < 0 || roleIdx < 0) {
    throw new Error('Missing required columns: MANDT, UNAME, AGS_ROLE_NAME');
  }

  const rows: AgrUsersRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('|').map(c => c.trim());
    
    rows.push({
      MANDT: cols[mandtIdx],
      UNAME: cols[unameIdx],
      AGS_ROLE_NAME: cols[roleIdx]
    });
  }

  return rows;
}
```

---

### File Upload with Express & Multer

```typescript
import multer from 'multer';

// Store in memory (safe for < 100MB files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) {
      cb(new Error('Only CSV files allowed'));
    } else {
      cb(null, true);
    }
  }
});

router.post('/agr-data/upload', upload.fields([...]), async (req, res) => {
  const agrUsersFile = req.files?.agr_users?.[0];
  const agr1251File = req.files?.agr_1251?.[0];

  if (!agrUsersFile || !agr1251File) {
    return res.status(400).json({ error: 'Both files required' });
  }

  const agrUsersContent = agrUsersFile.buffer.toString('utf-8');
  const agr1251Content = agr1251File.buffer.toString('utf-8');

  // Parse and process
});
```

---

## Part 5: Standard SAP SoD Rules Reference

Common conflicts to include in default rulesets:

### Financial Accounting (FI)
- FB60 (AP Invoice) ↔ F110 (Payment Run)
- FB01 (Post GL) ↔ FB50 (Manual Journal)
- FK01 (Vendor Master) ↔ F110 (Payment)

### Materials Management (MM)
- ME21N (PO Create) ↔ MIRO (Invoice Verify)
- MM01 (Material Master) ↔ MIRO (Invoice)
- MIGO (Goods Receipt) ↔ MIRO (Invoice)

### Sales & Distribution (SD)
- VA01 (Sales Order) ↔ VF01 (Billing)
- VA01 (Sales Order) ↔ VF02 (Billing Changes)

### System Administration (BASIS)
- SE38 (ABAP Editor) ↔ SM49 (OS Commands)
- PFCG (Role Assignment) ↔ SU01 (User Master)

---

## Summary Table

| Component | Status | Effort | Dependencies |
|-----------|--------|--------|--------------|
| Database schema | ❌ New | 1h | None |
| Parsing service | ❌ New | 2h | Schema |
| Detection service | ❌ New | 3h | Parsing, schema |
| Upload endpoint | ❌ New | 2h | Detection, multer |
| Detection endpoint | ❌ New | 1h | Detection service |
| Upload component | ❌ New | 2h | Upload endpoint |
| Detection panel | ❌ New | 2h | Detection endpoint |
| Integration | ❌ New | 1h | Both components |
| **Total** | | **14h** | |

**Estimated completion**: 3-5 calendar days with standard development velocity.

---

## Key Success Criteria

✅ Users can upload AGR_USERS and AGR_1251 CSV files  
✅ System detects T-code pair conflicts per role  
✅ Results show affected users and severity levels  
✅ AI remediation advice works for SoD violations  
✅ Results persist and are queryable by project  
✅ Frontend stats reflect actual uploaded data  
✅ Supports 5,000+ users and 500+ T-codes  
✅ Detection completes in < 5 seconds  

---

**Document Version**: 1.0  
**Last Updated**: April 21, 2026  
**Next Review**: Upon completion of Phase 1
