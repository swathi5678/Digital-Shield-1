# Digital Shield — Cybersecurity Intelligence MVP

A comprehensive cybersecurity intelligence platform for SAP transformation projects, detecting and surfacing security risks across 6 specialized engines.

## Features

- **AIE** — Authorization Intelligence Engine (SoD violation detection)
- **SCG** — Secure Code Guardian (ABAP static security analysis)
- **TDSL** — Test Data Sovereignty Layer (PII detection in test datasets)
- **CPM** — Compliance Posture Mapper (SOX/GDPR real-time scoring)
- **BAS** — Behavioral Anomaly Sentinel (insider threat from activity logs)
- **AGL** — Agent Governance Ledger (immutable AI agent action audit trail)

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite via better-sqlite3
- **Authentication**: JWT with role-based access control
- **AI**: OpenAI API (o4-mini for standard analysis, o3 for complex reasoning)

## Setup & Run

```bash
# Install all dependencies
npm run setup

# Start development server (runs both backend and frontend)
npm run dev
```

Server runs on `http://localhost:3001`
Client runs on `http://localhost:5173`

### Demo Credentials

- **ciso@demo.com** — Full access
- **pm@demo.com** — Project manager access
- **analyst@demo.com** — Security analyst access
- **auditor@demo.com** — Read-only access
- **Password for all**: Shield@2025

## Environment Variables

Create a `.env` file in the root directory:

```
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=digital-shield-jwt-secret-change-in-prod
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/digital-shield.db
```
.
## Project Structure

```
digital-shield/
├── client/               — React frontend
│   ├── src/
│   │   ├── components/   — React components
│   │   ├── pages/        — Page components
│   │   ├── hooks/        — Custom React hooks
│   │   ├── store/        — Zustand state management
│   │   ├── types/        — TypeScript interfaces
│   │   └── utils/        — Utility functions
│   └── vite.config.ts
├── server/               — Express backend
│   ├── src/
│   │   ├── routes/       — API routes
│   │   ├── services/     — Business logic
│   │   ├── db/           — Database schema & seed
│   │   ├── middleware/   — Express middleware
│   │   └── types/        — TypeScript interfaces
│   └── tsconfig.json
└── package.json
```

## API Routes

### Authentication
- `POST /api/auth/login` — User login
- `GET /api/auth/me` — Get current user

### Authorization Intelligence (AIE)
- `GET /api/projects/:id/auth-findings`
- `PATCH /api/projects/:id/auth-findings/:fid`

### Secure Code Guardian (SCG)
- `GET /api/projects/:id/code-findings`

### Test Data Sovereignty (TDSL)
- `GET /api/projects/:id/data-findings`
- `PATCH /api/projects/:id/data-findings/:did/mask`

### Compliance Posture (CPM)
- `GET /api/projects/:id/compliance`
- `PATCH /api/projects/:id/compliance/:cid`

### Behavioral Anomaly Sentinel (BAS)
- `GET /api/projects/:id/behavioral-alerts`
- `PATCH /api/projects/:id/behavioral-alerts/:aid/status`

### Agent Governance Ledger (AGL)
- `GET /api/projects/:id/agent-ledger`
- `GET /api/projects/:id/agent-ledger/export`

### AI Analysis
- `POST /api/ai/analyze`

## License

Internal use only.
