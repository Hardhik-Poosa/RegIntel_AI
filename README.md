# RegintelAI — Enterprise AI Compliance Platform Monorepo

Welcome to the **RegintelAI Monorepo**. RegintelAI is an enterprise-grade AI-powered compliance operating system providing continuous compliance monitoring, automated risk scoring, AI policy generation, vendor risk management, and regulatory tracking across Web and Mobile.

---

## 🏗️ Monorepo Architecture

```
RegintelAI/
│
├── backend/                 # FastAPI (Async Python, PostgreSQL, Alembic, Celery, Redis)
│
├── web/                     # React + Vite Enterprise Web Dashboard (Bootstrap 5, Recharts)
│
├── mobile/                  # React Native + Expo Cross-Platform Mobile Application (Expo SDK 52)
│
├── packages/                # Shared Monorepo TypeScript Packages
│   ├── api/                 # Reusable Axios API Client (@regintel/api)
│   ├── auth/                # Storage Adapter (@regintel/auth: Web localStorage & Expo SecureStore)
│   ├── ui-tokens/           # Design System & Colors (@regintel/ui-tokens)
│   ├── hooks/               # Custom React Hooks (@regintel/hooks)
│   ├── types/               # TypeScript Definitions (@regintel/types)
│   ├── utils/               # Formatting & Helpers (@regintel/utils)
│   ├── validation/          # Input Validation (@regintel/validation)
│   └── config/              # Shared App Constants (@regintel/config)
│
├── infrastructure/          # DevOps (Docker, Nginx, Kubernetes, Terraform)
├── docs/                    # Architecture & API documentation
└── scripts/                 # CLI & Development Launchers
```

> **Note on Architecture**: The root `package.json` contains no runtime or framework dependencies. All Expo/Metro dependencies reside strictly inside `mobile/`, React web dependencies inside `web/`, and shared logic in `packages/*`.

---

## 🚀 Phase 6: Continuous Compliance & Enterprise Governance

RegintelAI is evolving into a **Continuous Compliance Platform** that keeps organizations **Continuously Audit Ready**.

### Phase 6 Status & Roadmap

| Module | Description | Status |
|---|---|---|
| **6A — Continuous Monitoring** | Automated AWS/GitHub checks, evidence expiration scans, posture recalculation, job tracking (`ComplianceJob`) | **Completed ✅** |
| **6B — AI Regulatory Monitoring** | AI scrapers monitoring RBI, SEBI, PCI DSS, EU AI Act, SOC2, HIPAA | Planned |
| **6C — AI Policy Generator** | On-demand generation of SOC2/ISO/GDPR policies in DOCX/PDF | Planned |
| **6D — Dynamic AI Risk Engine** | Dynamic 0-100 risk scoring based on evidence, posture & threat feeds | Planned |
| **6E — Vendor Risk Management** | Third-party vendor risk scoring, SOC2 reviews, document tracking | Planned |
| **6F — AI Governance Module** | Model/Dataset registry, bias/hallucination checks, ISO 42001 & EU AI Act | Planned |
| **6G — Workflow Engine** | Automated trigger-action workflows (Jira tickets, Slack alerts) | Planned |
| **6H — Notification Center** | Multi-channel alerts (Slack, Teams, Email, Push, Webhooks) | Planned |
| **6I–6O — Executive & Platform** | CISO Dashboard, Advanced Analytics, Public REST API, Webhooks, SSO/MFA | Planned |

---

## ⚡ Continuous Monitoring Engine (Module 6A Capabilities)

- **`ComplianceJob` Tracking**: Records batch job status (`NIGHTLY_CRON`, `MANUAL`, `WEBHOOK`), `total_checks`, `passed_checks`, `failed_checks`, and error logs.
- **AWS Cloud Posture Scan**: Automated checks for S3 Public Access, IAM MFA, CloudTrail logging, and EBS encryption.
- **Evidence Expiration Scanner**: Detects evidence documents expiring in <30 days or expired.
- **Posture Recalculator**: Computes dynamic compliance percentage across controls and writes `ComplianceSnapshot` records.
- **Celery Automation**: Runs daily at `03:00 UTC` with instant local `asyncio` fallback when Redis is offline.

---

## ⚡ Quick Start & Development Workflow

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Python**: `3.10+`
- **PostgreSQL & Redis** (or Docker Desktop)

### Installation

```bash
# 1. Install root dependencies and build workspace packages
npm install

# 2. Run Database Migrations
cd backend && alembic upgrade head

# 3. Start FastAPI Backend
npm run dev:backend

# 4. Launch React Web Dashboard
npm run dev:web

# 5. Launch React Native Expo Mobile App
npm run dev:mobile
```

---

## 🔒 Shared Authentication & Storage
- **Web App ([web/](file:///d:/regintel-ai/web))**: Web JWT storage via `localStorage`.
- **Mobile App ([mobile/](file:///d:/regintel-ai/mobile))**: Secure hardware storage via `expo-secure-store`.

---

## 🛠️ Workspace Scripts

- `npm run dev`: Launch Turborepo parallel dev server across workspaces.
- `npm run dev:web`: Start React + Vite web dashboard (`http://localhost:3000`).
- `npm run dev:mobile`: Start Expo React Native bundler.
- `npm run dev:backend`: Launch Uvicorn FastAPI dev server (`http://127.0.0.1:8000`).
- `npm run build:web`: Build production bundle for web.
