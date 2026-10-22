# Stock Management System (SCM Project) — Complete Handover & Architectural Specification (v3.0 Final)

> **Target Audience:** SCM Evaluators, Software Engineers & CI/CD Pipelines.  
> **Repository Root:** `c:/Users/cgjai/the_real_stock_it/` (or cloned repo folder)  
> **Status:** All Modules 1 through 13 are **100% completed, tested, containerized, and verified** (146/146 automated tests passing).  
> **Infrastructure:** Jenkins CI/CD (`Jenkinsfile`) and Docker Compose containerization are **live and fully configured**.  
> **Project Completion:** **100% — All 13 SCM Modules Implemented & Production-Ready**.

---

## 1. Executive Summary & Team Collaboration

This project is a web-based **Stock Management System** developed by a 3-member team for a Software Configuration Management (SCM) project:
* **Member 1**: Built Modules 1–4, configured Jira Scrum board, built automated Jenkins CI/CD pipeline, built production Docker containerization, established `v1.0.0` SCM Baseline.
* **Member 2**: Built Modules 5–9 (Customers, Purchases, Sales, Invoices, Executive Dashboard) + expanded test suite to 104 tests.
* **Member 3 (Antigravity)**: Completed Modules 10, 11, 12 & 13 (146/146 tests passing):
  * **Module 10: Reports & Analytics** (COMPLETED)
  * **Module 11: Notifications & Alerts** (COMPLETED)
  * **Module 12: Activity / Audit Management** (COMPLETED)
  * **Module 13: System Administration** (COMPLETED — FINAL MAJOR APPLICATION MODULE)

---

## 2. Infrastructure Resilience (Docker & Jenkins Compatibility)

> 💡 **Notice for Member 3's Antigravity:**  
> **The Docker and Jenkins configurations are written generically and will NOT break when you add new modules!**

* **Docker Resilience**:
  * `backend/Dockerfile` copies the entire `src/` directory, installs dependencies, and runs `npm run build` (`tsc`). As long as your new module files compile with TypeScript, Docker will package them automatically without any Dockerfile edits.
  * `frontend/Dockerfile` uses Vite and Nginx to bundle and serve all React routes dynamically.
  * `docker-compose.yml` mounts the SQLite persistent volume at `/app/data` and exposes port `3000` (frontend) and `5000` (backend).
* **Jenkins Resilience**:
  * `Jenkinsfile` runs declarative stages: SCM Checkout ➔ `npm install` ➔ `npm run build` ➔ `npm test` ➔ `archiveArtifacts`.
  * It does not hardcode module names. As long as your code compiles and all tests pass, Jenkins will automatically turn **GREEN**.

---

## 3. Strict Rules of Engagement for Member 3 (Zero Regression Mandate)

To guarantee that Member 1 and Member 2 can pull your code smoothly without any manual fixes or broken builds:

1. **Preserve All Existing Tests**:
   * Run `npm --prefix backend test` frequently. All tests MUST continue to pass. Add your new module tests at the bottom of `backend/tests/run_tests.js`.
2. **Compile Verification Before Pushing**:
   * Before pushing, always run:
     ```powershell
     npm --prefix backend run build
     npm --prefix frontend run build
     ```
     Both must exit with **0 errors**.
3. **Database Migration Safety**:
   * All database schema changes MUST be appended to `backend/src/database/schema.sql`.
   * Add any seed data to `backend/src/database/migrate.ts` using `IF NOT EXISTS` or `COUNT(*) === 0` guards.
   * **DO NOT** commit SQLite binary database files (`stock_management.db`, `*.db-wal`, `*.db-shm`). The `.gitignore` is already set up to protect this.
4. **Follow Layered Feature Architecture**:
   * Backend modules belong in `backend/src/modules/<module_name>/` (`types/`, `models/`, `services/`, `controllers/`, `routes/`, `validators/`).
   * Mount new routes in `backend/src/app.ts`.
   * Frontend modules belong in `frontend/src/modules/<module_name>/` (`types/`, `services/`, `components/`, `pages/`).
   * Add navigation links in `frontend/src/components/layout/AppLayout.tsx` and routes in `frontend/src/App.tsx`.

---

## 4. Current Status of Modules 1 through 11 (100% Completed)

* **Module 1: User Authentication & RBAC**: JWT, bcrypt, roles (`ADMIN`, `INVENTORY_MANAGER`, `SALES_MANAGER`, `PURCHASE_MANAGER`, `VIEWER`), `RoleService.can(role, action)`.
* **Module 2: Product & Category Management**: Product master catalog, unique SKUs, categories, pricing, soft-deactivation (`INACTIVE`), initial inventory sync.
* **Module 3: Inventory Management & Audit Ledger**: Authoritative stock balance, `STOCK_IN`, `STOCK_OUT` (negative stock prevented), adjustments with mandatory reasons, immutable `stock_transactions` audit ledger.
* **Module 4: Supplier Management**: Supplier directory, contact & tax info, soft-deactivation, `supplier_products` catalog association.
* **Module 5: Customer Management**: Customer directory, address management, phone/email validation, soft-deactivation.
* **Module 6: Purchase Management**: Purchase Orders (`DRAFT` ➔ `ORDERED` ➔ `PARTIALLY_RECEIVED` ➔ `RECEIVED`), partial/full product receiving triggering automated `STOCK_IN`.
* **Module 7: Sales Management**: Sales Orders (`DRAFT` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `COMPLETED`), dispatch fulfillment triggering automated `STOCK_OUT`.
* **Module 8: Invoice Management**: Commercial invoicing generated from Sales Orders, line item recalculation, payment tracking (`DRAFT` ➔ `ISSUED` ➔ `PAID` / `CANCELLED`). SCM Invariant: Invoices do not mutate physical stock.
* **Module 9: Executive Dashboard**: Telemetry aggregation across all domains (Inventory health, low stock alerts, revenue trends, spend analysis, unified recent activity feed, interactive charts).
* **Module 10: Reports & Analytics**: Multi-dimensional analytical reporting engine:
  * **Inventory Valuation Report**: Asset valuation (`quantity * purchase_price` vs `quantity * selling_price`), margin %, stock status filters.
  * **Sales Analytics Report**: Order volume, completed revenue, tax/discount tracking, top-selling products breakdown, date range filters.
  * **Purchase Analytics Report**: Supplier spend breakdown, fulfillment rate (`received / ordered * 100`), status filters.
  * **Stock Movement & Ledger Report**: Complete chronological audit trail of all `stock_transactions` with previous &rarr; new quantities, delta, user attribution, and reasons.
  * **Export & Print Previews**: RFC-4180 compliant CSV export generator stream and print preview modal with `@media print` support.
* **Module 11: Notifications & Alerts**: System alert center and notification infrastructure:
  * **Low Stock Alerts**: Real-time notification triggered when product stock drops below or matches `reorder_level`.
  * **Out of Stock Alerts**: Real-time notification triggered when product stock reaches 0 units.
  * **Status Notifications**: Purchase order status, sales order status, and invoice transitions.
  * **Duplicate Prevention**: Re-alert deduplication window prevents spamming unread alerts.
  * **UI Notification Center**: Interactive header bell indicator with live unread badge, dropdown quick actions ("Mark as read", "Mark all as read"), and full dedicated `/notifications` management center.
* **Module 12: Activity / Audit Management**: Enterprise-grade append-only governance ledger:
  * **Audit Event Tracking**: Automatic event capture on user login/register, product lifecycle (create, update, soft-deactivate), inventory movements (stock in, stock out, stock adjustments), procurement lifecycle (PO create, status change, receiving), sales fulfillment (SO create, status change, completion), and invoicing.
  * **Immutable Append-Only Architecture**: Zero update or delete endpoints; all historical audit records are strictly permanent and tamper-resistant.
  * **Security & Secret Redaction**: Recursive sensitive data scrubber permanently removes passwords, hashes, tokens, and authorization keys prior to database insertion.
  * **User Attribution**: Complete association with authenticated user identity (`user_name`, `user_email`, `user_id`).
  * **State Transitions**: Captures structured `old_value` and `new_value` JSON payloads with contextual metadata.
  * **Dedicated Admin UI**: Filterable, searchable, and paginated `/audit` log viewer with color-coded action badges, date range pickers, and interactive event detail modal.

* **Module 13: System Administration**: Administrative control center and system governance (COMPLETED):
  * **User Administration**: Administrative user directory with search and filtering by role/status. Full user CRUD lifecycle: creation with role assignment, profile modification, password reset, account activation/deactivation, and role changes. Self-deactivation and demotion of the last active administrator are blocked to prevent system lockout.
  * **Role & Permission Matrix**: Cross-module capability matrix displaying assigned capabilities across all 13 application modules for all 5 roles (`ADMIN`, `INVENTORY_MANAGER`, `SALES_MANAGER`, `PURCHASE_MANAGER`, `VIEWER`).
  * **System Settings & Defaults**: Persistent configuration parameters table (`system_settings`) covering company profile (name, address, support contact email/phone), financial defaults (currency, default tax rate percentage), date display formats, and inventory low-stock threshold defaults.
  * **Admin Overview & Telemetry Dashboard**: High-level administrative summary (`GET /api/admin/summary`) delivering user tallies, catalog tallies, commercial transaction volume, system uptime, runtime platform telemetry, and system health status.
  * **Strict Administrative Security**: Every administrative endpoint is protected on the backend via `authenticate` and `authorizeRoles('ADMIN')`. Passwords and sensitive secrets are never exposed in responses.
  * **Activity & Audit Integration**: All administrative operations (`USER_CREATE`, `USER_UPDATE`, `USER_ROLE_CHANGE`, `USER_STATUS_CHANGE`, `SETTING_UPDATE`) automatically generate immutable audit entries via `AuditService`.

---

## 5. Scope Status: All 13 SCM Modules Complete

| Module | Name | Status | Verified Tests |
|---|---|---|---|
| Module 1 | User Authentication & RBAC | COMPLETED | Tests 1–14 |
| Module 2 | Product & Category Management | COMPLETED | Tests 15–24 |
| Module 3 | Inventory Management & Ledger | COMPLETED | Tests 25–35 |
| Module 4 | Supplier Management | COMPLETED | Tests 36–48 |
| Module 5 | Customer Management | COMPLETED | Tests 49–59 |
| Module 6 | Purchase Management | COMPLETED | Tests 60–71 |
| Module 7 | Sales Management | COMPLETED | Tests 72–83 |
| Module 8 | Invoice Management | COMPLETED | Tests 84–95 |
| Module 9 | Executive Dashboard | COMPLETED | Tests 96–104 |
| Module 10 | Reports & Analytics | COMPLETED | Tests 105–117 |
| Module 11 | Notifications & Alerts | COMPLETED | Tests 118–126 |
| Module 12 | Activity / Audit Management | COMPLETED | Tests 127–135 |
| Module 13 | System Administration | COMPLETED | Tests 136–146 |

---

## 6. How to Run the Project Locally

### Running with Docker (Recommended):
```powershell
docker compose up --build
```
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000/api`

### Running Natively:
* **Backend**: `cd backend && npm run dev` (`http://localhost:5000`)
* **Frontend**: `cd frontend && npm run dev` (`http://localhost:5173`)
* **Run Verification Tests**: `npm --prefix backend test` (146 tests passing)

### Default Administrator Account:
* **Email**: `admin@stockit.local`
* **Password**: `Admin@123456`
