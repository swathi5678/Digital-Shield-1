# KTern.AI Digital Shield — Documentation Package

## Contents

| File | Description | Size |
|------|-------------|------|
| `Digital_Shield_Technical_Documentation.docx` | Comprehensive technical documentation (Word format) — 25+ pages, 9 sections, full architecture, database schema, API reference | ~500 KB |
| `TECHNICAL_REFERENCE.md` | GitHub-renderable Markdown reference — complete, inline-searchable, all 6 engines documented field-by-field | ~400 KB |
| `architecture.mmd` | System architecture diagram (Mermaid graph) — layers, components, data flows, KTern integration | 1.2 KB |
| `api-flow.mmd` | API sequence diagram (Mermaid sequence) — request/response flows, JWT auth, AI calls | 2.1 KB |
| `db-schema.mmd` | Database ER diagram (Mermaid ER) — 8 tables, relationships, all fields | 3.8 KB |
| `README.md` | This file — regeneration instructions and quick reference | 5 KB |

## Quick Reference

**Product:** KTern.AI Digital Shield — Agentic Security Intelligence for SAP Transformation

**6 Security Engines:**
- **AIE** — Authorization Intelligence Engine (Segregation of Duties analysis)
- **SCG** — Secure Code Guardian (ABAP code vulnerability detection)
- **TDSL** — Test Data Sovereignty Layer (PII detection & masking)
- **CPM** — Compliance Posture Mapper (real-time compliance scorecard)
- **BAS** — Behavioral Anomaly Sentinel (insider threat detection)
- **AGL** — Agent Governance Ledger (immutable AI agent audit trails)

**Tech Stack:**
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite + Recharts
- Backend: Node.js + Express + TypeScript + SQLite (PostgreSQL-ready)
- AI: OpenAI o4-mini (standard) + o3 (reasoning)
- Auth: JWT + RBAC (4 roles: ciso, project_manager, security_analyst, auditor)

**Demo Credentials:**
```
Email: ciso@demo.com
Password: Shield@2025
```

## Regenerating Documentation

### Option 1: Auto-generate (Recommended)

From the `digital-shield-docs/` directory:

```bash
npm run generate
```

This runs both generators sequentially:
- `generate-docx.js` → outputs `Digital_Shield_Technical_Documentation.docx`
- `generate-diagrams.js` → outputs `api-flow.mmd` and `db-schema.mmd`

### Option 2: Generate Individual Components

**Word document only:**
```bash
npm run docx
```

**Mermaid diagrams only:**
```bash
npm run diagrams
```

### Prerequisites for Regeneration

- Node.js 18.x or higher
- npm 9.x or higher
- `docx` package (automatically installed via `npm install`)

## Viewing the Documentation

### Word Document

Open `Digital_Shield_Technical_Documentation.docx` in:
- Microsoft Word 2010+
- Google Docs
- LibreOffice Writer
- Any modern word processor

**Features:**
- 9 major sections (Executive Summary, Architecture, Modules, Database, API, AI Engine, Deployment, Roadmap, Glossary)
- Professional formatting with color-coded tables and severity badges
- Internal table of contents
- Page numbers and headers/footers
- 25+ pages of comprehensive technical detail

### Markdown Reference

Open `TECHNICAL_REFERENCE.md` in:
- GitHub (auto-renders with syntax highlighting)
- Any text editor
- VS Code (with Markdown Preview)
- Online Markdown viewers

**Features:**
- 12 comprehensive sections
- All 8 database tables documented field-by-field
- All 15 API endpoints listed with examples
- Code examples with language tags (TypeScript, SQL, JSON)
- All 6 security engines detailed with data sources and outputs

### Mermaid Diagrams

#### Option A: Online Viewer (Recommended)

1. Go to https://mermaid.live
2. Copy-paste contents of any `.mmd` file
3. Diagram renders instantly
4. Export as PNG/SVG/PDF

#### Option B: Mermaid CLI

Install Mermaid command-line tools:
```bash
npm install -g @mermaid-js/mermaid-cli
```

Render diagrams to PNG:
```bash
mmdc -i output/architecture.mmd -o output/architecture.png -t dark
mmdc -i output/api-flow.mmd -o output/api-flow.png -t dark
mmdc -i output/db-schema.mmd -o output/db-schema.png -t dark
```

#### Option C: VS Code

1. Install "Markdown Preview Mermaid Support" extension
2. Open `.mmd` file
3. Click "Open Preview" (⌘K ⌘V or Ctrl+K Ctrl+V)

## Document Sections Overview

### Word Document (Digital_Shield_Technical_Documentation.docx)

1. **Cover Page** — Branding, metadata, document classification
2. **Executive Summary** — Strategic positioning, gap analysis, 6-engine overview, business value
3. **System Architecture** — Layer breakdown table, data flow (7 steps), RBAC
4. **Security Modules** — 6 subsections (AIE, SCG, TDSL, CPM, BAS, AGL), each with problem/approach/outputs
5. **Database Design** — SQLite schema, 4 primary table schemas (Auth Findings, Code Findings, Data Findings, Agent Ledger)
6. **API Reference** — 15 endpoints summary table, login example, AI analysis example
7. **AI Intelligence Engine** — Model rationale, 7 analysis modes table, o-series constraints
8. **Deployment & Security** — Local setup, npm scripts, security considerations
9. **Roadmap & Glossary** — 4-phase timeline, 19-term glossary

### Markdown (TECHNICAL_REFERENCE.md)

1. **Product Overview** — Strategic context, gap analysis, component overview
2. **System Architecture** — 2.1 Layers, 2.2 Data Flow, 2.3 RBAC
3. **Security Engines** — 6 subsections (3.1–3.6), each with problem/approach/data sources/outputs/KTern hook
4. **Database Schema** — 8.1 Overview, 8.2–8.8 Table schemas (Users, Projects, Auth Findings, Code Findings, Data Findings, Compliance Controls, Behavioral Alerts, Agent Ledger)
5. **API Reference** — 5.1 Endpoints, 5.2 Auth examples, 5.3 AI analysis example
6. **AI Intelligence Engine** — 6.1 Model rationale, 6.2 7 modes table, 6.3 o-series constraints, 6.4 Model comparison
7. **Frontend Architecture** — 7.1 Component hierarchy, 7.2 State management, 7.3 Hooks, 7.4 Design tokens
8. **KTern Integration Map** — 5-row table (Module | Engine | Integration | Value)
9. **Local Setup** — Prerequisites, quick start, scripts, production migration
10. **Security Considerations** — Auth, data protection, OpenAI API security
11. **Roadmap** — 4-phase timeline
12. **Glossary** — 19 SAP/security terms

### Mermaid Diagrams

#### architecture.mmd
- **Type:** Directed graph (graph TD)
- **Layers:** Presentation, Client Services, API Gateway, Security Engines, AI, Data, KTern Integration
- **Connections:** Shows data flow from UI through API to engines to data/AI layers
- **Use:** System design documentation, onboarding materials

#### api-flow.mmd
- **Type:** Sequence diagram
- **Actors:** User, Vite dev server, Express API, SQLite, OpenAI
- **Flows:** Login, fetching findings, AI analysis, ledger queries
- **Use:** Understanding request/response patterns, API documentation

#### db-schema.mmd
- **Type:** Entity-Relationship diagram
- **Entities:** 8 tables (Projects, Users, Auth Findings, Code Findings, Data Findings, Compliance Controls, Behavioral Alerts, Agent Ledger)
- **Relationships:** All foreign keys shown with cardinality
- **Use:** Database design reference, schema migrations

## File Structure After Generation

```
digital-shield-docs/
├── output/
│   ├── Digital_Shield_Technical_Documentation.docx  (generated)
│   ├── TECHNICAL_REFERENCE.md                        (generated)
│   ├── architecture.mmd                              (generated in Phase 2)
│   ├── api-flow.mmd                                  (generated in Phase 5)
│   ├── db-schema.mmd                                 (generated in Phase 5)
│   └── README.md                                     (this file)
├── generate-docx.js                                  (generator script)
├── generate-diagrams.js                              (generator script)
├── package.json
├── .nvmrc
└── node_modules/                                     (from npm install)
```

## Customization

### Editing the Markdown

Edit `TECHNICAL_REFERENCE.md` directly in any text editor. It's fully Markdown-compatible and renders in GitHub, VS Code, and all major markdown viewers.

### Editing the Word Document

For one-time edits:
1. Open `Digital_Shield_Technical_Documentation.docx` in Word/Google Docs
2. Make changes
3. Save

For recurring edits, modify `generate-docx.js` to change:
- Section headings and content (Paragraph objects)
- Table data and formatting
- Colors and styling (via NAVY, PURPLE, etc. constants)
- Page layout and margins

Then regenerate: `npm run docx`

### Editing Diagrams

#### For architecture.mmd:
Edit `generate-diagrams.js` section "// API Flow Diagram" to modify the sequence, participants, or messages.

#### For api-flow.mmd:
Edit `generate-diagrams.js` section "// API Flow Diagram" to change API endpoints, request/response patterns.

#### For db-schema.mmd:
Edit `generate-diagrams.js` section "// Database Schema Diagram" to add/remove tables, fields, or relationships.

Then regenerate: `npm run diagrams`

## Quality Assurance Checklist

After regeneration, verify:

- [ ] Word document opens without errors in Word/Google Docs
- [ ] Markdown file renders correctly in GitHub / VS Code
- [ ] All 3 Mermaid diagrams render correctly at https://mermaid.live
- [ ] Word document has at least 20 pages and 9 sections
- [ ] Markdown file has at least 800 lines (wc -l TECHNICAL_REFERENCE.md)
- [ ] All table formatting is correct (columns aligned, colors visible)
- [ ] All code examples are syntax-highlighted (in Word: Courier New font, in Markdown: proper language tags)
- [ ] All links and cross-references work
- [ ] No Lorem Ipsum or placeholder text remains

## Troubleshooting

### "docx package not found"
```bash
npm install
```

### Word document won't open
- Try converting: Online converter or LibreOffice save-as
- Verify Node.js version: `node --version` (should be 18+)
- Regenerate: `npm run docx`

### Mermaid diagrams not rendering at mermaid.live
- Copy full contents of `.mmd` file (including first line like "graph TD" or "sequenceDiagram")
- Ensure no trailing Unicode characters (file should be plain UTF-8)
- Try incognito/private browser window

### Markdown not rendering in GitHub
- Ensure file is saved as `.md` (not `.markdown` or `.txt`)
- Check for syntax errors: GitHub will show "Failed to render this file"

## Contact & Support

For questions about:
- **Product documentation:** Contact security@ktern.ai
- **Documentation generation:** Review generate-docx.js and generate-diagrams.js comments
- **Deployment:** See "9. Local Setup & Deployment" in TECHNICAL_REFERENCE.md

---

**Last Generated:** 2025-04-19
**Version:** 1.0
**Maintainer:** KTern.AI Technical Documentation Team
**License:** Confidential — KTern.AI Internal Use Only
