# AICTE-Approval-Workflow

Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System

## 1. Project Purpose & Current Status

This repository contains an open-source technical prototype developed for the AICTE Approval Workflow Automation problem statement (Smart India Hackathon SIH26262), modeling the approval, scrutiny, and compliance workflows of technical educational institutions under the All India Council for Technical Education (AICTE).

> [!NOTE]
> **Independent Academic Prototype — No Official Affiliation:**
> This project is an independent technical prototype and is **not officially affiliated with, endorsed by, maintained by, or an official service of the All India Council for Technical Education (AICTE)**. All statutory regulatory decisions, orders, and accreditations remain exclusively with authorized AICTE committees and officers.

### Current Status: Phase 0 — Initial Project Skeleton

The project is currently in the **foundation scaffolding phase**. This initial runnable skeleton establishes:
- Standardized directory layout for a modular monolith.
- Root npm workspace orchestration for `frontend` and `backend`.
- Minimal Vite + React + TypeScript frontend application with institutional styling tokens.
- Minimal Express + TypeScript backend service exposing a non-privileged health endpoint (`GET /api/health`).
- Configuration templates, linting/build configurations, and testing harness (Vitest + Supertest).

> [!IMPORTANT]
> **Implementation Boundaries & Deferred Capabilities:**
> - Authentication, session management, and RBAC policies are deferred to subsequent approved phases.
> - Relational persistence (Neon PostgreSQL with Prisma) is configured at the boundary level; schema models remain pending contract reconciliation. No remote database connections or migrations are active.
> - Real-time transport (Socket.IO) is designated but deactivated until authenticated session integration is complete.
> - Automatic AI/OCR analysis and simulated statutory approvals are strictly out of scope for this foundation.

---

## 2. High-Level Architecture & Technology Stack

The platform is designed as a **modular monolith** with clear separation of concerns:

- **Frontend:**
  - **Framework:** React 18 with TypeScript and Vite
  - **Styling:** Tailwind CSS with CSS variables mapped to the approved institutional palette (Inter typography, deep navy `#17243A`, primary blue `#315EBD`, surface white `#FFFFFF`, canvas `#F6F8FC`)
  - **Routing:** React Router v6
  - **Design System:** Accessible components aligned with shadcn/ui patterns
- **Backend:**
  - **Runtime & Framework:** Node.js (v20+) with Express and TypeScript
  - **Validation:** Zod schema validation for environment configuration and incoming payloads
  - **Testing:** Vitest and Supertest
  - **Database Target:** Neon PostgreSQL accessed via Prisma ORM (reconciliation in progress)
  - **Real-Time Transport:** Socket.IO (server-side authenticated event hints)

---

## 3. Authoritative Specifications & Documentation Package

All primary project requirements, regulatory analysis, UI/UX guidelines, database schemas, and API contracts reside in the baseline package:

- **Baseline Package:** [`docs/project-baseline/`](docs/project-baseline/)
- **Final Technology Decisions & Superseding Corrections:** [`docs/project-baseline/refined/FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md`](docs/project-baseline/refined/FINAL_DECISIONS_AND_SUPERSEDING_CORRECTIONS.md)
- **UI/UX Specification:** [`docs/project-baseline/refined/AICTE_Antigravity_UI_UX_Specification_FINAL.md`](docs/project-baseline/refined/AICTE_Antigravity_UI_UX_Specification_FINAL.md)
- **System Architecture:** [`docs/project-baseline/refined/project-architecture.md`](docs/project-baseline/refined/project-architecture.md)
- **Database Schema Models:** [`docs/project-baseline/refined/DATABASE_SCHEMA_REVISION_2.md`](docs/project-baseline/refined/DATABASE_SCHEMA_REVISION_2.md)
- **API Specifications:** [`docs/project-baseline/refined/api-specifications_FINAL.md`](docs/project-baseline/refined/api-specifications_FINAL.md)

### Regulatory Notice

> [!WARNING]
> All statutory workflow routes, scrutiny checklists, deficiency remediations, appeal windows, and fee calculations must be derived from and verified against the applicable official **AICTE Approval Process Handbook (APH 2024–2027)** and published Gazette notifications. The system must never independently make statutory approval or rejection decisions; statutory authority remains exclusively with authorized AICTE committees and officers.

---

## 4. Repository Structure

```text
AICTE-Approval-Workflow/
├── frontend/                     # React + Vite + TypeScript application
│   ├── public/                   # Static browser assets
│   ├── src/
│   │   ├── assets/               # Branding and illustration assets
│   │   ├── components/           # UI components (ui/, layout/, shared/)
│   │   ├── layouts/              # Top-level shell layouts (RootLayout)
│   │   ├── pages/                # Page views (public/, institution/, official/, admin/)
│   │   ├── routes/               # Client-side routing definitions
│   │   ├── services/             # API client and backend integration services
│   │   ├── hooks/                # Custom React hooks
│   │   ├── context/              # React context providers
│   │   ├── types/                # Frontend TypeScript domain types
│   │   ├── utils/                # Utility helpers (e.g. cn)
│   │   ├── App.tsx               # App router wrapper
│   │   ├── main.tsx              # React DOM entry point
│   │   └── index.css             # Tailwind directives and CSS design tokens
│   ├── index.html                # Vite HTML shell
│   ├── package.json              # Frontend package manifest
│   ├── tsconfig.json             # Frontend TypeScript configuration
│   └── vite.config.ts            # Vite bundler and proxy configuration
├── backend/                      # Express + TypeScript API service
│   ├── prisma/                   # Prisma schema scaffold and boundary documentation
│   ├── src/
│   │   ├── config/               # Environment configuration loading
│   │   ├── controllers/          # API route controllers (health.controller)
│   │   ├── middleware/           # Central error handling, 404, request logger
│   │   ├── routes/               # Express route modules
│   │   ├── services/             # Core business and process services
│   │   ├── validators/           # Zod schema validators
│   │   ├── types/                # Backend TypeScript types
│   │   ├── utils/                # Utility functions and logger
│   │   ├── sockets/              # Socket.IO placeholder and boundary docs
│   │   ├── app.ts                # Express application assembly
│   │   └── server.ts             # Process initialization and graceful shutdown
│   ├── tests/                    # Integration and unit tests (health.test.ts)
│   ├── package.json              # Backend package manifest
│   ├── tsconfig.json             # Backend TypeScript configuration
│   └── .env.example              # Documented environment variables template
├── docs/                         # Project documentation and specifications
│   └── project-baseline/         # Canonical baseline specifications package
├── scripts/                      # Workspace automation and verification scripts
├── .editorconfig                 # Multi-editor code style consistency
├── .gitignore                    # Comprehensive source control exclusion rules
├── package.json                  # Root npm workspace manifest
└── README.md                     # Root project documentation
```

---

## 5. Prerequisites & Getting Started

### Prerequisites

- **Node.js:** v20.0.0 or later (Tested on v22.19.0)
- **npm:** v10.0.0 or later (Tested on v11.13.0)
- **Git:** Installed and configured

### Initial Installation

Install all dependencies across both workspaces from the root directory:

```bash
npm install
```

### Environment Configuration

The backend requires local environment variables for custom configurations. Copy the template:

```bash
# macOS / Linux / PowerShell:
cp backend/.env.example backend/.env

# Windows Command Prompt:
copy backend\.env.example backend\.env
```

*Note: For the initial scaffold, default fallbacks are provided, allowing the backend to start and pass health tests without an active `.env` file.*

---

## 6. Development & Operational Scripts

All commands can be executed from the project root using npm workspace targets:

| Command | Action |
|---|---|
| `npm run dev` | Start the frontend development server |
| `npm run dev:frontend` | Start frontend on [http://localhost:5173](http://localhost:5173) |
| `npm run dev:backend` | Start backend with live-reload on [http://localhost:5000](http://localhost:5000) |
| `npm run build` | Build production bundles for both frontend and backend |
| `npm run build:frontend` | Compile frontend TypeScript and build Vite distribution |
| `npm run build:backend` | Compile backend TypeScript with `tsc` |
| `npm run test` | Run test suites across all workspaces |
| `npm run test:backend` | Run backend Vitest integration suite |
| `npm run typecheck` | Perform strict TypeScript type checking without emitting files |

---

## 7. Verification of the Health Endpoint

1. Start the backend:
   ```bash
   npm run dev:backend
   ```
2. Verify the health status:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-25T05:30:00.000Z",
     "uptimeSeconds": 1,
     "version": "0.1.0"
   }
   ```
