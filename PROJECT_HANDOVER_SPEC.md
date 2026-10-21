# Stock Management System (SCM Project) — Complete Handover & Architectural Specification

> **Target Audience:** Incoming Software Engineer / AI Agent in Google Antigravity.  
> **Repository Root:** `d:/the_real_stock_it/`  
> **Status:** Modules 1 through 5 are **100% completed, tested, and verified** (59/59 automated tests passing).  
> **Next Module in Queue:** **Module 6: Purchase Management**.

---

## 1. Executive Project Overview

This project is a web-based **Stock Management System** developed as part of a **Software Configuration Management (SCM)** academic/engineering curriculum.

### Key SCM & Architectural Principles
1. **Incremental, Strict Modular Development**: Each module is implemented sequentially in isolation without modifying or regressing previous modules.
2. **High Cohesion, Low Coupling**: Modules communicate through clean, explicit service boundaries and join tables. Domain logic is strictly encapsulated within its own module folder.
3. **Traceability & Auditability**:
   - No hard deletes for master entities (products, suppliers, customers, users). Soft-deactivations transition status to `INACTIVE`.
   - All physical inventory balance modifications record immutable rows in `stock_transactions` with actor ID, timestamp, before/after quantity, and mandatory reason.
4. **Zero-Regression Mandate**: When building subsequent modules (Module 6+), existing endpoints, components, and tests must remain functional.

---

## 2. Technology Stack & Runtime Configuration

### Backend
- **Runtime**: Node.js (v20+ / v22+)
- **Database Engine**: Native Node.js `node:sqlite` (`DatabaseSync` with `PRAGMA foreign_keys = ON;` and `PRAGMA journal_mode = WAL;`)
- **Web Framework**: Express 4.x with TypeScript (`tsc`)
- **Authentication**: JWT (`jsonwebtoken`) with 24-hour expiration
- **Password Hashing**: `bcryptjs` (salt rounds: 10)
- **CORS**: Configured for `http://localhost:5173` with credentials support
- **Port**: `5001` (`http://localhost:5001/api`) *(Default configured to 5001 to avoid EADDRINUSE conflict with Docker Desktop / WSL relay on port 5000)*

### Frontend
- **Framework**: React 18.x with TypeScript
- **Bundler & Dev Server**: Vite 6.x
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS v3 with Lucide React icons
- **Port**: `5173` (`http://localhost:5173`)

### Default Seeded Credentials
- **Email**: `admin@stockit.local`
- **Password**: `Admin@123456`
- **Role**: `ADMIN`

---

## 3. Directory Layout & Module Structure

The project follows a feature-folder modular pattern identically across backend and frontend:

```
the_real_stock_it/
├── backend/
│   ├── data/                           # SQLite database file (stock_management.db)
│   ├── src/
│   │   ├── config/                     # env.ts, application configuration
│   │   ├── database/                   # connection.ts, schema.sql, migrate.ts
│   │   ├── middleware/                 # authMiddleware.ts, errorHandler.ts
│   │   ├── modules/
│   │   │   ├── authentication/         # MODULE 1: Auth, Roles, Users
│   │   │   │   ├── controllers/        # AuthController.ts
│   │   │   │   ├── models/             # User.ts, Role.ts
│   │   │   │   ├── routes/             # authRoutes.ts
│   │   │   │   ├── services/           # AuthService.ts, RoleService.ts
│   │   │   │   ├── types/              # auth.types.ts
│   │   │   │   └── validators/         # authValidators.ts
│   │   │   ├── products/               # MODULE 2: Products & Categories
│   │   │   │   ├── controllers/        # ProductController.ts, CategoryController.ts
│   │   │   │   ├── models/             # Product.ts, Category.ts
│   │   │   │   ├── routes/             # productRoutes.ts, categoryRoutes.ts
│   │   │   │   ├── services/           # ProductService.ts, CategoryService.ts
│   │   │   │   ├── types/              # product.types.ts
│   │   │   │   └── validators/         # productValidators.ts
│   │   │   ├── inventory/              # MODULE 3: Inventory Balances & Ledger
│   │   │   │   ├── controllers/        # InventoryController.ts
│   │   │   │   ├── models/             # Inventory.ts, StockTransaction.ts
│   │   │   │   ├── routes/             # inventoryRoutes.ts
│   │   │   │   ├── services/           # InventoryService.ts
│   │   │   │   ├── types/              # inventory.types.ts
│   │   │   │   └── validators/         # inventoryValidators.ts
│   │   │   ├── suppliers/              # MODULE 4: Supplier Registry & Catalog
│   │   │   │   ├── controllers/        # SupplierController.ts
│   │   │   │   ├── models/             # Supplier.ts, SupplierProduct.ts
│   │   │   │   ├── routes/             # supplierRoutes.ts
│   │   │   │   ├── services/           # SupplierService.ts
│   │   │   │   ├── types/              # supplier.types.ts
│   │   │   │   └── validators/         # supplierValidators.ts
│   │   │   └── customers/              # MODULE 5: Customer Management
│   │   │       ├── controllers/        # CustomerController.ts
│   │   │       ├── models/             # Customer.ts
│   │   │       ├── routes/             # customerRoutes.ts
│   │   │       ├── services/           # CustomerService.ts
│   │   │       ├── types/              # customer.types.ts
│   │   │       └── validators/         # customerValidators.ts
│   │   ├── app.ts                      # Express app factory & route mounting
│   │   └── server.ts                   # Server entrypoint
│   └── tests/
│       └── run_tests.js                # 59-test comprehensive verification suite
├── frontend/
│   ├── src/
│   │   ├── components/                 # Shared UI (AppLayout, Navbar, Sidebar, etc.)
│   │   ├── modules/
│   │   │   ├── authentication/         # Auth pages, context, ProtectedRoute
│   │   │   ├── products/               # Products list, modals, Category management
│   │   │   ├── inventory/              # Stock ledger, Stock IN/OUT modals, adjustments
│   │   │   ├── suppliers/              # Supplier directory, detail view, product linker
│   │   │   └── customers/              # Customer directory, add/edit modal, details modal
│   │   ├── App.tsx                     # React Router definition
│   │   └── main.tsx                    # React DOM entrypoint
└── PROJECT_HANDOVER_SPEC.md            # This specification file
```

---

## 4. Completed Modules Status

### Module 1: User Authentication & Access Control (COMPLETED)
- **Features**: Registration, Login, Logout, Current User Profile query/update, Password Hashing (`bcrypt`), JWT Token generation/validation.
- **Roles Seeded**:
  - `ADMIN` (Full wildcard permissions `*`)
  - `INVENTORY_MANAGER` (Products, Inventory, Supplier read, Customer read)
  - `SALES_MANAGER` (Sales, Customers, Invoices, Read Inventory/Products)
  - `PURCHASE_MANAGER` (Purchases, Suppliers, Read Customers, Read Inventory/Products)
  - `VIEWER` (Read-only access across all domains)
- **Enforcement**: Centralized `RoleService.can(role, action)` and `requirePermission(action)` middleware.

### Module 2: Product / Item Management (COMPLETED)
- **Features**: Product catalog with SKU, Category, Selling Price, Purchase Price, Reorder Level, Unit.
- **Categories**: Master category management (Electronics, Office Supplies, Raw Materials, Packaging, Finished Goods seeded).
- **Rules**: Unique SKU enforcement, non-negative prices, soft-deactivation (status -> `INACTIVE`).
- **Inventory Handshake**: Creating a product automatically initializes a corresponding `inventory` balance row with the `opening_stock`.

### Module 3: Inventory Management & Audit Ledger (COMPLETED)
- **Features**: Real-time inventory balance tracking (`current_quantity`), dynamic stock status calculation:
  - `IN_STOCK`: quantity > reorder_level
  - `LOW_STOCK`: 0 < quantity <= reorder_level
  - `OUT_OF_STOCK`: quantity = 0
- **Stock Operations**:
  - `STOCK_IN`: Increments balance with reference/reason.
  - `STOCK_OUT`: Decrements balance, strictly forbids negative stock.
  - `ADJUSTMENT`: Reconciles physical counts (`INCREASE`, `DECREASE`, `SET_QUANTITY`) with mandatory audit reason.
- **Audit Ledger**: Immutable `stock_transactions` table recording all movements with user ID, timestamps, and balance deltas.

### Module 4: Supplier Management (COMPLETED)
- **Features**: Supplier directory (Company name, contact person, email, phone, full address, tax number, notes).
- **Status & Soft Deletion**: Active / Inactive states with soft-deactivation preserving historical relationships.
- **Product Catalog Association**: `supplier_products` join table allowing multiple products to be linked/unlinked to any supplier.
- **Future Integration Hooks**: Supplier detail modal contains a dedicated "Purchase History" tab with a clean placeholder ready for Module 6.

### Module 5: Customer Management (COMPLETED)
- **Features**: Customer directory (Customer Name, Company Name, Email, Phone, Alternate Phone, Address, City, State, Country, Postal Code, Tax/GST number, Notes, Status).
- **Status & Soft Deactivation**: `ACTIVE` and `INACTIVE` states with confirmation dialogs; soft deactivation prevents breaking historical sales orders and invoices.
- **Search & Filters**: Search by ID, customer name, company, email, phone. Multi-parameter filters by status (`ALL`, `ACTIVE`, `INACTIVE`), city, and state.
- **Future Integration Hooks**: Customer details view includes dedicated tabs and placeholders for **Orders** (Module 7), **Sales History** (Module 7), and **Invoices & Billing** (Module 8).
- **Authorization**: `ADMIN` and `SALES_MANAGER` have full management access (create, edit, toggle status); all roles have read access.

---

## 5. Complete Database Schema (SQLite)

```sql
PRAGMA foreign_keys = ON;

-- 1. Roles
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL COLLATE NOCASE,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Products
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL COLLATE NOCASE,
    category_id TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL DEFAULT 'pcs',
    purchase_price REAL NOT NULL DEFAULT 0.0,
    selling_price REAL NOT NULL DEFAULT 0.0,
    opening_stock INTEGER NOT NULL DEFAULT 0,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 5. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    product_id TEXT UNIQUE NOT NULL,
    current_quantity INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 6. Stock Transactions (Immutable Audit Ledger)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL, -- 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT NOT NULL,
    reference TEXT,
    performed_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 7. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    tax_number TEXT,
    contact_person TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 8. Supplier-Product Junction
CREATE TABLE IF NOT EXISTS supplier_products (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(supplier_id, product_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 9. Customers
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    company_name TEXT,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    tax_number TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE'
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_trans_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_trans_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_trans_created_at ON stock_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_trans_performed_by ON stock_transactions(performed_by);
CREATE INDEX IF NOT EXISTS idx_suppliers_supplier_name ON suppliers(supplier_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier_id ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product_id ON supplier_products(product_id);
CREATE INDEX IF NOT EXISTS idx_customers_customer_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_state ON customers(state);
```

---

## 6. API Route Catalog

All routes return JSON with a standard envelope:
`{ "success": true, "data": ... }` or `{ "success": false, "message": "error description" }`.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Authenticate and receive JWT cookie/token
- `GET /api/auth/me` — Get profile of authenticated user
- `PUT /api/auth/profile` — Update current user profile
- `POST /api/auth/logout` — Invalidate user session
- `GET /api/auth/roles` — List available system roles

### Products & Categories (`/api/products`, `/api/categories`)
- `GET /api/products` — List products with search, pagination, category & stock filters
- `GET /api/products/:id` — Get single product
- `POST /api/products` — Create product (initializes inventory record)
- `PUT /api/products/:id` — Update product details
- `DELETE /api/products/:id` — Soft-deactivate product (`status = 'INACTIVE'`)
- `GET /api/categories` — List active categories
- `POST /api/categories` — Create category

### Inventory (`/api/inventory`)
- `GET /api/inventory` — List current stock balances with status tags
- `GET /api/inventory/metrics` — Aggregate metrics (Total items, low stock count, out of stock count)
- `GET /api/inventory/:productId` — Single product balance
- `POST /api/inventory/stock-in` — Inbound stock addition
- `POST /api/inventory/stock-out` — Outbound stock depletion (negative stock forbidden)
- `POST /api/inventory/adjustment` — Audit adjustment with mandatory reason
- `GET /api/inventory/transactions` — Query immutable audit ledger with filters

### Suppliers (`/api/suppliers`)
- `GET /api/suppliers` — List suppliers with search, status & country filters
- `GET /api/suppliers/metrics` — Supplier aggregate metrics
- `GET /api/suppliers/:id` — Supplier details with linked products
- `POST /api/suppliers` — Create supplier
- `PUT /api/suppliers/:id` — Update supplier details
- `PATCH /api/suppliers/:id/status` — Toggle Active / Inactive status
- `DELETE /api/suppliers/:id` — Soft-deactivate supplier
- `GET /api/suppliers/:id/products` — List products linked to supplier
- `POST /api/suppliers/:id/products` — Link product to supplier
- `DELETE /api/suppliers/:id/products/:productId` — Unlink product from supplier

### Customers (`/api/customers`)
- `GET /api/customers` — List customers with pagination, search, status, city & state filters
- `GET /api/customers/metrics` — Customer metrics (Total customers, active count, inactive count)
- `GET /api/customers/:id` — Customer details (with orders, sales_history & invoices placeholders)
- `POST /api/customers` — Register new customer with field & email uniqueness validation
- `PUT /api/customers/:id` — Update customer information
- `PATCH /api/customers/:id/status` — Toggle customer status (`ACTIVE` / `INACTIVE`)
- `DELETE /api/customers/:id` — Soft-deactivate customer (`status = 'INACTIVE'`)

---

## 7. Verification & Testing

The repository includes a comprehensive 59-test integration suite:
```powershell
# Run from backend directory:
npm test
```
**Current Test Coverage Breakdown (59/59 Passing):**
- **Tests 1–14**: Authentication, invalid passwords, email collision, profile isolation, bcrypt verification, role assignment.
- **Tests 15–24**: Category uniqueness, product creation, duplicate SKU rejection, price validation, search/filters, soft delete.
- **Tests 25–35**: Inventory initialization, Stock IN/OUT, negative stock prevention, adjustments, status state machines, ledger logging.
- **Tests 36–48**: Supplier registry CRUD, email collision, soft deactivation, catalog association/disassociation, RBAC protections.
- **Tests 49–59**: Customer registry CRUD, validation checks, duplicate email conflict, search & multi-parameter filtering, soft-deactivation state machine, RBAC authorization (SALES_MANAGER create/edit, VIEWER read-only).

---

## 8. Remaining Modules Roadmap (For Subsequent Sprints)

The planned remaining modules for the SCM project are:
1. **Module 6: Purchase Management** *(Next to implement)*
   - Purchase orders (PO generation, status: `DRAFT`, `ORDERED`, `RECEIVED`, `CANCELLED`).
   - Linking suppliers (Module 4) and products (Module 2).
   - Inbound fulfillment triggering automatic `STOCK_IN` transactions (Module 3).
2. **Module 7: Sales Management**
   - Sales orders (SO generation, status: `PENDING`, `DISPATCHED`, `COMPLETED`, `CANCELLED`).
   - Linking customers (Module 5) and products (Module 2).
   - Outbound fulfillment triggering automatic `STOCK_OUT` transactions (Module 3).
3. **Module 8: Invoices & Payments / Billing**
   - Invoicing for purchases (AP) and sales (AR).
4. **Module 9: Dashboard & Reporting / Analytics**
   - Executive dashboard aggregating Inventory, Sales, Purchases, and Financial health.
5. **Module 10: Notifications & Activity Audit Trail**
   - Low stock notifications, system events, and global audit log.

---

## 9. Prompt to Hand Over to the Next Antigravity Session

Copy and paste the prompt in the box below to start the next module in Antigravity:

```markdown
Hello Antigravity! I am continuing development of our web-based Stock Management System (SCM project).

The previous developer completed Modules 1 through 5 (Authentication, Product Management, Inventory Management, Supplier Management, and Customer Management).
All 59 existing automated tests are passing in `backend/tests/run_tests.js`.
Full technical and architectural specifications are documented in `PROJECT_HANDOVER_SPEC.md` at the project root.

Please inspect the existing architecture, database schema (`backend/src/database/schema.sql`), and API patterns.

We are now ready to implement ONLY the next module:
👉 MODULE 6: PURCHASE MANAGEMENT

Requirements:
- Follow all existing patterns (TypeScript, Express, node:sqlite, React, Tailwind).
- Maintain high cohesion, low coupling, soft-deactivation, and role-based permissions.
- Inbound receiving should automatically trigger Stock IN transactions in Module 3.
- Do not break or regress any existing modules (preserve 59/59 tests and add new tests for Module 6).
- Please confirm you have inspected the project and are ready to implement Module 6.
```
