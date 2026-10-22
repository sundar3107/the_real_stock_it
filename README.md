# 📦 Stock Management System (SCM Project)

[![CI Pipeline](https://img.shields.io/badge/Jenkins-Pipeline%20Passing-brightgreen?logo=jenkins)](http://localhost:8080)
[![Automated Tests](https://img.shields.io/badge/Tests-104%2F104%20Passing-success)](backend/tests/run_tests.js)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)](docker-compose.yml)
[![Jira](https://img.shields.io/badge/Jira-Scrum%20Managed-0052CC?logo=jira)](https://atlassian.net)

A web-based **Stock Management System** developed as part of the **Software Configuration Management (SCM)** engineering curriculum.

The project demonstrates full lifecycle configuration control, automated quality gates, continuous integration, and containerized deployment across 9 cohesive modules.

---

## 🏛️ SCM Toolchain & Architecture Matrix

| SCM Discipline | Tool / Artifact | Implementation in this Project |
|---|---|---|
| **Configuration Identification** | **Git & Git Tags** | Version baselines (`v1.0.0`), semantic commits, tracked artifacts. |
| **Change Control** | **Jira (Scrum)** | User Stories, Acceptance Criteria, Story Points, Sprints, Defect / Bug tracking. |
| **Continuous Integration (CI)** | **Jenkins (`Jenkinsfile`)** | Automated 5-stage declarative pipeline triggering 104 end-to-end tests upon every push. |
| **Environment Baseline** | **Docker & Compose** | Multi-stage Dockerfiles (`node:22-alpine`, `nginx:alpine`) for reproducible deployments. |
| **Audit & Traceability** | **SQLite Audit Ledger** | Immutable `stock_transactions` table recording all physical stock deltas and actor IDs. |

---

## 🚀 Quick Start (Docker Deployment)

The entire multi-tier system (Backend + Frontend + Reverse Proxy + SQLite volume) starts with **a single command**:

```powershell
docker compose up --build
```

* **Frontend Application**: [http://localhost:3000](http://localhost:3000)
* **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Default Administrator Credentials
* **Email**: `admin@stockit.local`
* **Password**: `Admin@123456`
* **Role**: System Administrator (`ADMIN`)

---

## 🧪 Automated Testing & Quality Gate

The system contains an automated regression suite verifying **104 test scenarios** across all 9 modules:

```powershell
cd backend
npm test
```

### Test Coverage Breakdown (104/104 Passing):
* **Module 1**: Authentication, JWT validation, password hashing, and role-based access control (RBAC).
* **Module 2**: Product catalog, category master data, and unique SKU enforcement.
* **Module 3**: Real-time inventory balance, Stock IN/OUT, negative stock guards, and immutable audit ledger.
* **Module 4**: Supplier registry, soft-deactivation, and product catalog associations.
* **Module 5**: Customer registry, contact details, and location filtering.
* **Module 6**: Purchase Orders (PO lifecycle: `DRAFT` ➔ `ORDERED` ➔ `RECEIVED` with automated Stock IN).
* **Module 7**: Sales Orders (SO lifecycle: `DRAFT` ➔ `CONFIRMED` ➔ `COMPLETED` with automated Stock OUT).
* **Module 8**: Commercial Invoicing (Generated from Sales Orders, payment status tracking).
* **Module 9**: Executive Dashboard (Cross-module telemetry, metrics aggregation, revenue trends, and charts).

---

## ⚙️ Jenkins CI/CD Pipeline

Defined as **Pipeline-as-Code** in [`Jenkinsfile`](Jenkinsfile):

```groovy
pipeline {
    agent any
    stages {
        stage('SCM Checkout')          { /* Git checkout */ }
        stage('Install Dependencies')  { /* npm install (Backend & Frontend) */ }
        stage('Build & Compilation')   { /* tsc & vite build */ }
        stage('Automated Quality Gate'){ /* npm test (104 tests) */ }
        stage('Archive Artifacts')     { /* backend/dist/**, frontend/dist/** */ }
    }
}
```

---

## 🛠️ Technology Stack
* **Backend**: Node.js (v22), Express 4, TypeScript, Native `node:sqlite` (`DatabaseSync` in WAL mode), JWT, bcrypt.
* **Frontend**: React 18, TypeScript, Vite 6, Tailwind CSS, Lucide Icons, React Router DOM v6.
* **Web Server / Proxy**: Nginx Alpine reverse proxy.
* **SCM Infrastructure**: Git, Jira, Jenkins, Docker, Docker Compose.
