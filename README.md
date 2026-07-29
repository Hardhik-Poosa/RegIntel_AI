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
├── mobile/                  # React Native + Expo Cross-Platform Mobile Application
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
│
├── docs/                    # Architecture & API documentation
│
└── scripts/                 # CLI & Development Launchers
```

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

# 2. Start FastAPI Backend
npm run dev:backend

# 3. Launch React Web Dashboard
npm run dev:web

# 4. Launch React Native Expo Mobile App
npm run dev:mobile

# 5. Or launch everything in parallel with Turborepo
npm run dev
```

---

## 🔒 Shared Authentication Strategy

Authentication uses JWT token propagation.
- **Web App ([web/](file:///d:/regintel-ai/web))**: Stores tokens via `localStorage` through `WebTokenStorage`.
- **Mobile App ([mobile/](file:///d:/regintel-ai/mobile))**: Stores tokens securely via `expo-secure-store` using `MobileSecureTokenStorage`.

Both applications invoke the exact same FastAPI backend endpoints without any backend modification.

---

## 🛠️ Monorepo Scripts

- `npm run dev`: Launch Turborepo parallel dev server across packages.
- `npm run dev:web`: Start React + Vite web dashboard.
- `npm run dev:mobile`: Start Expo React Native mobile bundler.
- `npm run dev:backend`: Launch Uvicorn FastAPI dev server.
- `npm run build`: Build web, mobile, and shared packages.
- `npm run lint`: Run ESLint checks across monorepo packages.
