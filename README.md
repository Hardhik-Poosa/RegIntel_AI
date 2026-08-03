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
| **6A — Continuous Monitoring Engine** | Configurable Rule Engine, Delta Change History, Alert Center, Scan History, System Health Dashboard & Manual Scanning | **Completed ✅** |
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

The **Phase 6A Continuous Monitoring Engine** delivers 10 core enterprise governance capabilities:

1. **Configurable Monitoring Rule Engine**: Custom rules (`MonitoringRule`) supporting AWS, GitHub, Evidence Engine, and System providers with configurable severity levels (Critical, High, Medium, Low) and instant enable/disable toggles.
2. **Compliance Change History & Score Drift**: Historical tracking (`ComplianceChange`) capturing posture deltas (e.g. `91%` → `87%`, `-4%` drift reason), control IDs, and resolution states.
3. **Compliance Alert Center**: System-wide alert aggregation (`ComplianceAlert`) categorized by severity, component, assignee, and resolution timestamp.
4. **Scan Execution History**: Real-time audit logs (`ComplianceScan`) recording start/finish timestamps, scan duration, total assets scanned, and error/failure counts.
5. **Monitoring Activity Timeline**: Real-time activity feed streaming posture changes, alert triggers, and scan executions.
6. **System Health Dashboard**: Live operational health indicators for AWS (*Healthy*), GitHub (*Healthy*), Slack Webhooks (*Connected*), Evidence Engine (*Healthy*), and AI Monitoring Pipeline (*Running*).
7. **Manual On-Demand Scan Trigger**: One-click execution button (`POST /api/v1/monitors/run`) running active monitoring rules without waiting for cron schedules.
8. **Scan Statistics**: Aggregated metrics API (`GET /api/v1/monitors/statistics`) providing Average Scan Time, Success %, Total Failures, Assets Checked, Evidence Checked, and Rules Triggered.
9. **Standardized REST API Suite**: Complete endpoint coverage for rules, scans, alerts, health metrics, statistics, asset inventory, and timeline events.
10. **Enterprise Web Dashboard**: Full-featured [ComplianceMonitor.jsx](file:///d:/regintel-ai/web/src/pages/ComplianceMonitor.jsx) user interface with 10 metric cards, live rule toggles, delta viewer, alert center, timeline feed, and individual check runners.

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
