# RegintelAI - AI-Powered Compliance Intelligence Platform

[![Status](https://img.shields.io/badge/Status-Phase_5_Complete-success)](https://shields.io/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-blue)](https://fastapi.tiangolo.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React-cyan)](https://react.dev/)

RegintelAI is a sophisticated, AI-powered compliance and risk management SaaS platform. It is designed to help organizations, particularly in the FinTech and AI sectors, navigate complex regulatory landscapes by providing "Compliance Intelligence as a Service."

The platform centralizes compliance data, leverages Large Language Models (LLMs) for analysis and content generation, and provides actionable insights to de-risk the business and automate compliance tasks.

---

## ✅ Core Features (Phases 1-5 Completed)

The current version of RegintelAI is a feature-rich, enterprise-ready application.

- **AI Compliance Copilot**: An intelligent chat interface that allows users to ask natural language questions about their compliance posture, risks, and priorities. The Copilot has full context of the organization's controls and compliance data.
- **Compliance Framework Engine**: A system to manage and install regulatory frameworks (e.g., `RBI FinTech`, `PCI-DSS`, `SOC 2`, `EU AI Act`). The platform is pre-seeded with 8 frameworks and 37 essential controls.
- **Weighted Risk & Compliance Scoring**: A sophisticated engine that calculates a real-time, weighted compliance score based on control status and risk levels. It tracks this score over time to show trends.
- **Evidence Management with AI Validation**: Users can upload evidence for controls. An AI-powered scanner analyzes the evidence to validate its relevance and quality.
- **Enterprise Integrations**: Includes a GitHub integration to scan repositories for compliance signals like the presence of `SECURITY.md` or `CODEOWNERS` files.
- **Automated Control Analysis**: Background AI tasks analyze control descriptions to suggest risk levels, categories, and plain-language summaries, reducing manual effort.
- **Role-Based Access Control (RBAC)**: Pre-defined user roles (`ADMIN`, `COMPLIANCE_OFFICER`, `VIEWER`) to enforce security and segregation of duties.
- **Multi-Tenancy & User Management**: Securely isolates data between different organizations and allows admins to invite, manage, and remove users.
- **Reporting & Dashboards**: Includes PDF report generation, an executive KPI dashboard, and risk heatmaps for clear visualization of the compliance landscape.

## 🛠️ Tech Stack

| Area      | Technology                                                              |
| :-------- | :---------------------------------------------------------------------- |
| **Backend**   | Python, FastAPI, SQLAlchemy (Async), PostgreSQL, Celery, Redis          |
| **Frontend**  | React, Vite, Axios, Bootstrap, Recharts                                 |
| **AI**        | Generic LLM integration via a REST API (e.g., OpenAI, Anthropic, local) |
| **DevOps**    | Docker, Alembic (Migrations)                                            |
| **Hosting**   | Railway (Backend/DB/Redis), Vercel (Frontend)                           |

---

## 📂 Project Structure Explained

This section explains the purpose of the key files and directories in the project.

### `backend/`

The backend is a modern, asynchronous Python application built with FastAPI.

```
backend/
├── alembic/                  # Manages database schema migrations.
│   └── env.py                # Alembic's main configuration script.
├── app/                      # Main application source code.
│   ├── api/                  # FastAPI routers (HTTP endpoints).
│   │   ├── copilot.py        # Endpoints for the AI Copilot.
│   │   └── controls.py       # CRUD endpoints for Internal Controls.
│   ├── core/                 # Core logic: configuration, security.
│   │   ├── config.py         # Loads environment variables (e.g., database URL, secrets).
│   │   └── security.py       # Handles JWT authentication and password hashing.
│   ├── db/                   # Database session management.
│   │   └── database.py       # Defines the async database session factory.
│   ├── models/               # SQLAlchemy ORM models (defines database tables).
│   │   ├── user.py           # User model.
│   │   ├── control.py        # InternalControl model.
│   │   └── framework.py      # ComplianceFramework model.
│   ├── schemas/              # Pydantic schemas for data validation and API shapes.
│   │   ├── user.py           # Schemas for user creation and response.
│   │   └── control.py        # Schemas for control creation and updates.
│   ├── services/             # Business logic is encapsulated here.
│   │   ├── copilot_service.py  # Builds context and interacts with the AI for the Copilot.
│   │   ├── policy_service.py   # Generates policy documents using AI.
│   │   ├── compliance_service.py # Calculates weighted compliance scores.
│   │   ├── monitor_service.py  # Runs continuous compliance checks (e.g., GitHub scans).
│   │   └── evidence_service.py # Handles file uploads and AI scanning of evidence.
│   ├── seeds/                # Scripts to populate the database with initial data.
│   │   ├── seed_frameworks.py  # Seeds the 8 core compliance frameworks.
│   │   └── seed_framework_controls.py # Seeds the 37 template controls.
│   └── tasks/                # Asynchronous background tasks (Celery).
│       └── ai_tasks.py       # Celery task to run AI analysis on controls without blocking.
└── alembic.ini               # Configuration file for Alembic.
```

### `frontend/`

The frontend is a responsive single-page application (SPA) built with React and Vite.

```
frontend/
└── src/
    ├── assets/               # Static assets like images and CSS.
    ├── components/           # Reusable React components (e.g., charts, modals, loaders).
    ├── hooks/                # Custom React hooks for shared logic.
    ├── layouts/              # Main page layouts (e.g., DashboardLayout with sidebar).
    ├── pages/                # Top-level page components, one for each route.
    │   ├── Copilot.jsx       # The main AI chat interface.
    │   ├── Controls.jsx      # Page for listing and managing compliance controls.
    │   └── Compliance.jsx    # The main compliance dashboard with scores and heatmaps.
    ├── services/             # API interaction layer.
    │   └── api.js            # Centralized Axios instance with interceptors for auth.
    ├── App.jsx               # Root component with routing setup.
    └── main.jsx              # Entry point of the React application.
```

---

## 🚀 Roadmap

The project is developed in phases. Phases 1-5 are complete, establishing a powerful compliance operating system. The next phases focus on automation, scale, and deepening the AI capabilities.

### 🚧 Phase 6 — Continuous Compliance Platform (Next)

The immediate goal is to move from manual compliance tracking to automated, continuous monitoring.

- **Continuous Compliance Monitoring**: Build direct integrations with **AWS, Azure, and GCP** to automatically check for misconfigurations and update control status.
- **AI Policy Generator**: Enhance the existing service to generate a suite of formal policy documents (e.g., Data Protection, Incident Response) tailored to the organization's frameworks.
- **Vendor Risk Management**: Introduce a module to track third-party vendors, manage contracts, and assess their risk posture.
- **Regulatory Update Engine**: A service to monitor regulatory feeds (e.g., RBI, SEBI, NIST) and alert users to relevant changes.
- **Compliance Alert Engine**: A system to generate real-time alerts for critical issues like missing evidence, high-risk control gaps, or failed security scans.

### 🔵 Future Phases (7-10)

- **Phase 7 (Enterprise Scale & Security)**: Focus on features for large enterprises, including **SSO/SAML**, **MFA**, immutable audit logs, and horizontal scalability.
- **Phase 8 (AI Compliance Intelligence)**: Evolve the platform into an AI-native system with a predictive **AI Risk Engine**, an **AI Document Understanding** module (to read PDFs and contracts), and a powerful **AI Knowledge Graph**.
- **Phase 9 (Commercial SaaS Platform)**: Build the business infrastructure, including **Stripe integration** for subscription billing, self-service onboarding, and trial accounts.
- **Phase 10 (Global Compliance Ecosystem)**: The long-term vision to expand into new verticals (Healthcare, Insurance) and build a marketplace for third-party integrations and compliance benchmarks.

---

## ⚙️ Local Setup and Installation

Follow these steps to get the project running locally for development.

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **Docker** and **Docker Compose**
- **PostgreSQL** client tools (optional, for direct DB access)

### 1. Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a virtual environment and activate it
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Set up environment variables
#    Copy .env.example to .env and fill in your database URL and secrets.
cp .env.example .env

# 5. Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# 6. Run database migrations
alembic upgrade head

# 7. Seed the database with initial data (frameworks and controls)
python -m app.seeds.seed_frameworks
python -m app.seeds.seed_framework_controls
```

### 2. Frontend Setup

```bash
# 1. Navigate to the frontend directory in a new terminal
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Set up environment variables
#    The frontend uses Vite's proxy, so no .env file is needed for local dev.
```

## ▶️ Running the Application

### 1. Start the Backend

Ensure your backend virtual environment is active.

```bash
# From the backend/ directory

# Start the FastAPI server
uvicorn app.main:app --reload

# Start the Celery worker for background tasks
celery -A app.tasks.worker.celery_app worker --loglevel=info
```

The backend API will be available at `http://localhost:8000`.

### 2. Start the Frontend

```bash
# From the frontend/ directory
npm run dev
```

The frontend application will be available at `http://localhost:5173`. You can now register a new organization and log in.


