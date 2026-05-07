const fs = require('fs');
const path = require('path');

// Verify and count architecture.mmd
console.log('Verifying Mermaid diagrams...\n');

const archPath = './output/architecture.mmd';
if (fs.existsSync(archPath)) {
  const archContent = fs.readFileSync(archPath, 'utf8');
  const archLines = archContent.split('\n').length;
  console.log(`✓ architecture.mmd  — ${archLines} lines (System architecture diagram)`);
} else {
  console.error('✗ architecture.mmd not found. Run phase 2 first.');
  process.exit(1);
}

// API Flow Diagram (Sequence Diagram)
const apiFlowContent = `sequenceDiagram
    participant U as User (Browser)
    participant V as Vite Dev Server :5173
    participant E as Express API :3001
    participant DB as SQLite Database
    participant AI as OpenAI API

    U->>V: Load React App
    V-->>U: Bundle served
    U->>E: POST /api/auth/login
    E->>DB: SELECT * FROM users WHERE email = ?
    DB-->>E: User record + password hash
    E-->>U: JWT token + user object

    Note over U,E: All subsequent requests include Authorization: Bearer <token>

    U->>E: GET /api/projects/:id/auth-findings
    E->>DB: SELECT * FROM auth_findings WHERE project_id = ?
    DB-->>E: Finding rows (AIE SoD violations)
    E-->>U: { data: [...findings], meta: { total, page } }

    U->>E: POST /api/ai/analyze { mode: remediation_plan, context: {...} }
    E->>AI: chat.completions.create (model: o3, max_completion_tokens: 1500)
    AI-->>E: { choices: [{ message: { content: "..." } }] }
    E-->>U: { analysis: "...", model: "o3", tokens_used: 892 }

    U->>E: GET /api/projects/:id/agent-ledger
    E->>DB: SELECT * FROM agent_ledger WHERE project_id = ? ORDER BY executed_at DESC
    DB-->>E: Ledger entries (AIE agent actions)
    E-->>U: { ledger: [...entries], meta: { total } }
`;

fs.writeFileSync('./output/api-flow.mmd', apiFlowContent, 'utf8');
const apiFlowLines = apiFlowContent.split('\n').length;
console.log(`✓ api-flow.mmd      — ${apiFlowLines} lines (API sequence diagram)`);

// Database Schema Diagram (ER Diagram)
const dbSchemaContent = `erDiagram
    PROJECTS {
        text id PK
        text name
        text client
        text migration_type
        text source_system
        text target_system
        text phase
        int overall_risk_score
        int compliance_score
        int created_at
        int go_live_date
    }
    USERS {
        text id PK
        text email UK
        text name
        text password_hash
        text role
        text project_id FK
        int last_login
        int created_at
    }
    AUTH_FINDINGS {
        text id PK
        text project_id FK
        text finding_type
        text severity
        text role_name
        text tcode_1
        text tcode_2
        int user_count
        text status
        text remediation_plan
        int detected_at
    }
    CODE_FINDINGS {
        text id PK
        text project_id FK
        text object_name
        text object_type
        text finding_type
        text severity
        int line_number
        text code_snippet
        real cvss_score
        text cwe_id
        text status
        text ai_fix
        int detected_at
    }
    DATA_FINDINGS {
        text id PK
        text project_id FK
        text dataset_name
        text table_name
        text field_name
        text pii_type
        text regulation
        int record_count
        int masked
        text masking_status
        int detected_at
    }
    COMPLIANCE_CONTROLS {
        text id PK
        text project_id FK
        text framework
        text control_id
        text control_name
        text status
        text evidence
        int findings_mapped
        int findings_resolved
        int last_assessed
    }
    BEHAVIORAL_ALERTS {
        text id PK
        text project_id FK
        text user_name
        text alert_type
        text description
        text severity
        int risk_score
        text status
        text investigation_notes
        int occurred_at
    }
    AGENT_LEDGER {
        text id PK
        text project_id FK
        text agent_name
        text agent_version
        text triggering_user
        text action_type
        text target_object
        text target_system
        text data_fields_accessed
        text intended_outcome
        text execution_status
        int records_affected
        text risk_level
        text hash
        text hash_parent
        int executed_at
    }

    PROJECTS ||--o{ USERS : "belongs to"
    PROJECTS ||--o{ AUTH_FINDINGS : "has"
    PROJECTS ||--o{ CODE_FINDINGS : "has"
    PROJECTS ||--o{ DATA_FINDINGS : "has"
    PROJECTS ||--o{ COMPLIANCE_CONTROLS : "has"
    PROJECTS ||--o{ BEHAVIORAL_ALERTS : "has"
    PROJECTS ||--o{ AGENT_LEDGER : "has"
`;

fs.writeFileSync('./output/db-schema.mmd', dbSchemaContent, 'utf8');
const dbSchemaLines = dbSchemaContent.split('\n').length;
console.log(`✓ db-schema.mmd     — ${dbSchemaLines} lines (Database ER diagram)`);

console.log('\n=== MERMAID DIAGRAMS GENERATED ===');
console.log('\nTo render and export diagrams:');
console.log('1. Visit: https://mermaid.live');
console.log('2. Paste contents of any .mmd file');
console.log('3. Export as PNG/SVG\n');
console.log('Or use Mermaid CLI:');
console.log('  npm install -g @mermaid-js/mermaid-cli');
console.log('  mmdc -i architecture.mmd -o architecture.png -t dark\n');
