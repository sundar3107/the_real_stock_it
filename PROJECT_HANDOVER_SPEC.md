# Stock Management System (SCM Project) — Complete Handover & Architectural Specification (v2.0)

> **Target Audience:** Incoming Software Engineer / AI Agent in Google Antigravity (Team Member 3).  
> **Repository Root:** `d:/the_real_stock_it/` (or cloned repo folder)  
> **Status:** Modules 1 through 9 are **100% completed, tested, containerized, and verified** (104/104 automated tests passing).  
> **Infrastructure:** Jenkins CI/CD (`Jenkinsfile`) and Docker Compose containerization are **live and fully configured**.  
> **Next Modules in Queue:** **Modules 10, 11, 12, and 13**.

---

## 1. Executive Summary & Team Collaboration

This project is a web-based **Stock Management System** developed by a 3-member team for a Software Configuration Management (SCM) project:
* **Member 1 (Current Session)**: Built Modules 1–4, configured Jira Scrum board, built automated Jenkins CI/CD pipeline, built production Docker containerization, established `v1.0.0` SCM Baseline.
* **Member 2**: Built Modules 5–9 (Customers, Purchases, Sales, Invoices, Executive Dashboard) + expanded test suite to 104 tests.
* **Member 3 (You / Incoming Antigravity)**: Responsible for implementing the remaining final modules:
  * **Module 10: Reports & Analytics**
  * **Module 11: Notifications & Alerts**
  * **Module 12: Activity / Audit Management**
  * **Module 13: System Administration**

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

1. **Preserve All 104 Existing Tests**:
   * Run `npm --prefix backend test` frequently. All 104 tests MUST continue to pass. Add your new module tests at the bottom of `backend/tests/run_tests.js` (e.g. Test 105, 106...).
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

## 4. Current Status of Modules 1 through 9 (100% Completed)

* **Module 1: User Authentication & RBAC**: JWT, bcrypt, roles (`ADMIN`, `INVENTORY_MANAGER`, `SALES_MANAGER`, `PURCHASE_MANAGER`, `VIEWER`), `RoleService.can(role, action)`.
* **Module 2: Product & Category Management**: Product master catalog, unique SKUs, categories, pricing, soft-deactivation (`INACTIVE`), initial inventory sync.
* **Module 3: Inventory Management & Audit Ledger**: Authoritative stock balance, `STOCK_IN`, `STOCK_OUT` (negative stock prevented), adjustments with mandatory reasons, immutable `stock_transactions` audit ledger.
* **Module 4: Supplier Management**: Supplier directory, contact & tax info, soft-deactivation, `supplier_products` catalog association.
* **Module 5: Customer Management**: Customer directory, address management, phone/email validation, soft-deactivation.
* **Module 6: Purchase Management**: Purchase Orders (`DRAFT` ➔ `ORDERED` ➔ `PARTIALLY_RECEIVED` ➔ `RECEIVED`), partial/full product receiving triggering automated `STOCK_IN`.
* **Module 7: Sales Management**: Sales Orders (`DRAFT` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `COMPLETED`), dispatch fulfillment triggering automated `STOCK_OUT`.
* **Module 8: Invoice Management**: Commercial invoicing generated from Sales Orders, line item recalculation, payment tracking (`DRAFT` ➔ `ISSUED` ➔ `PAID` / `CANCELLED`). SCM Invariant: Invoices do not mutate physical stock.
* **Module 9: Executive Dashboard**: Telemetry aggregation across all domains (Inventory health, low stock alerts, revenue trends, spend analysis, unified recent activity feed, interactive charts).

---

## 5. Scope for Upcoming Modules (10 to 13)

### Module 10: Reports & Analytics
* **Objective**: Generate detailed analytical reports and exportable data.
* **Requirements**:
  * Inventory Valuation Report (Current stock × purchase/selling price, stock turnover).
  * Sales Report (Sales by date range, customer, product, and revenue).
  * Purchase Report (Purchases by supplier, date range, fulfillment status).
  * Stock Movement / Ledger Report (Filtered audit trail of `stock_transactions`).
  * Support format previews (tabular preview, print-ready view, or CSV export).

### Module 11: Notifications & Alerts
* **Objective**: System alerts and notification center for warehouse and administrative personnel.
* **Requirements**:
  * Low Stock Alerts (Triggered when `current_quantity <= reorder_level`).
  * Out of Stock Alerts (Triggered when `current_quantity == 0`).
  * Purchase Order Delivery Alerts (Approaching or overdue `expected_delivery_date`).
  * Unpaid Invoice Alerts (Invoices nearing or past `due_date`).
  * Notification badge in frontend header with Mark as Read / Clear actions.

### Module 12: Activity / Audit Management
* **Objective**: Centralized enterprise-level audit trail for SCM governance.
* **Requirements**:
  * Audit logging for all critical system mutations (User login/logout, product creation/deletion, PO approval, SO completion, invoice status changes).
  * Audit fields: `id`, `user_id`, `action`, `module`, `entity_id`, `details` (JSON payload or human-readable description), `ip_address`, `timestamp`.
  * Dedicated searchable and filterable Audit Log view (restricted to `ADMIN`).

### Module 13: System Administration
* **Objective**: Administrative control center and system governance.
* **Requirements**:
  * User Administration (List all users, change roles, activate/deactivate user accounts, reset passwords).
  * Role & Permission Matrix viewer.
  * System Settings (Company profile name, default currency, tax rate defaults, low-stock alert thresholds).
  * Database Backup & Maintenance (Endpoint/action to trigger database snapshot or export).

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
* **Run Verification Tests**: `cd backend && npm test` (104 tests)

### Default Administrator Account:
* **Email**: `admin@stockit.local`
* **Password**: `Admin@123456`
