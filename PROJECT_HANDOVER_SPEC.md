# Stock Management System (SCM Project) — Complete Handover & Architectural Specification

> **Target Audience:** Incoming Software Engineer / AI Agent in Google Antigravity.  
> **Repository Root:** `C:\Users\abish\.gemini\antigravity\scratch\the_real_stock_it\`  
> **Status:** Modules 1 through 6 are **100% completed, tested, and verified** (71/71 automated tests passing).  
> **Next Module in Queue:** **Module 7: Sales Management**.

---

## 1. Executive Project Overview

This project is a web-based **Stock Management System** developed as part of a **Software Configuration Management (SCM)** academic/engineering curriculum.

### Key SCM & Architectural Principles
1. **Incremental, Strict Modular Development**: Each module is implemented sequentially in isolation without modifying or regressing previous modules.
2. **High Cohesion, Low Coupling**: Modules communicate through clean, explicit service boundaries and join tables. Domain logic is strictly encapsulated within its own module folder.
   - *Purchase Management owns purchase transactions.*
   - *Inventory Management (`InventoryService.stockIn`) is the sole authority for physical stock quantities and immutable stock ledger entries.*
3. **Traceability & Auditability**:
   - No hard deletes for master entities (products, suppliers, customers, users, purchase orders). Soft-deactivations transition status to `INACTIVE` or `CANCELLED`.
   - All physical inventory balance modifications record immutable rows in `stock_transactions` with actor ID, timestamp, before/after quantity, and mandatory reason.
4. **Zero-Regression Mandate**: When building subsequent modules (Module 7+), existing endpoints, components, and tests must remain functional.

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
│   │   │   ├── customers/              # MODULE 5: Customer Management
│   │   │   │   ├── controllers/        # CustomerController.ts
│   │   │   │   ├── models/             # Customer.ts
│   │   │   │   ├── routes/             # customerRoutes.ts
│   │   │   │   ├── services/           # CustomerService.ts
│   │   │   │   ├── types/              # customer.types.ts
│   │   │   │   └── validators/         # customerValidators.ts
│   │   │   └── purchases/              # MODULE 6: Purchase Management
│   │   │       ├── controllers/        # PurchaseController.ts
│   │   │       ├── models/             # PurchaseOrder.ts, PurchaseOrderItem.ts
│   │   │       ├── routes/             # purchaseRoutes.ts
│   │   │       ├── services/           # PurchaseService.ts
│   │   │       ├── types/              # purchase.types.ts
│   │   │       └── validators/         # purchaseValidators.ts
│   │   ├── app.ts                      # Express app factory & route mounting
│   │   └── server.ts                   # Server entrypoint
│   └── tests/
│       └── run_tests.js                # 71-test comprehensive verification suite
├── frontend/
│   ├── src/
│   │   ├── components/                 # Shared UI (AppLayout, Navbar, Sidebar, etc.)
│   │   ├── modules/
│   │   │   ├── authentication/         # Auth pages, context, ProtectedRoute
│   │   │   ├── products/               # Products list, modals, Category management
│   │   │   ├── inventory/              # Stock ledger, Stock IN/OUT modals, adjustments
│   │   │   ├── suppliers/              # Supplier directory, detail view, product linker
│   │   │   ├── customers/              # Customer directory, add/edit modal, details modal
│   │   │   └── purchases/              # Purchases list, PO create/edit form, receive modal, details modal
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
  - `INVENTORY_MANAGER` (Products, Inventory, Supplier read, Customer read, Purchase read, Purchase receive)
  - `SALES_MANAGER` (Sales, Customers, Invoices, Read Inventory/Products/Suppliers/Purchases)
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

### Module 6: Purchase Management (COMPLETED)
- **Features**: Purchase order lifecycle management (`DRAFT`, `ORDERED`, `PARTIALLY_RECEIVED`, `RECEIVED`, `CANCELLED`).
- **Order Creation & Financials**: Select active supplier, select valid products, dynamic line items (quantity > 0, unit price >= 0), tax and discount calculations, live subtotal and total computation.
- **Editing & Status Transitions**: DRAFT orders can have items, pricing, notes, and delivery dates updated. Orders can be submitted (`ORDERED`) or cancelled (`CANCELLED`). Orders with already received items cannot be cancelled.
- **Inbound Goods Receiving (Critical Inventory Integration)**:
  - Receive products partially or in full against `ORDERED` or `PARTIALLY_RECEIVED` purchase orders.
  - Direct integration with `InventoryService.stockIn` — authoritative stock balance incrementation and immutable stock ledger creation in `stock_transactions` referencing `PO #<id>`.
  - Automatic PO status advancement to `PARTIALLY_RECEIVED` or `RECEIVED` based on line item progress.
  - Strict validation: cannot receive against draft or cancelled orders; cannot receive excess quantities beyond ordered remaining.
- **Authorization**:
  - `ADMIN` & `PURCHASE_MANAGER`: Full access to create, edit, approve, cancel, and receive purchase orders.
  - `INVENTORY_MANAGER`: Can view purchase orders and receive inbound products into inventory.
  - `VIEWER` & `SALES_MANAGER`: Read-only access.

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

-- 10. Purchase Orders (Module 6)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL,
    order_date TEXT NOT NULL,
    expected_delivery_date TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')),
    subtotal REAL NOT NULL DEFAULT 0.0 CHECK(subtotal >= 0),
    tax REAL NOT NULL DEFAULT 0.0 CHECK(tax >= 0),
    discount REAL NOT NULL DEFAULT 0.0 CHECK(discount >= 0),
    total REAL NOT NULL DEFAULT 0.0 CHECK(total >= 0),
    notes TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);

-- 11. Purchase Order Items (Module 6)
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    purchase_order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    received_quantity INTEGER NOT NULL DEFAULT 0 CHECK(received_quantity >= 0),
    unit_price REAL NOT NULL DEFAULT 0.0 CHECK(unit_price >= 0),
    tax REAL NOT NULL DEFAULT 0.0 CHECK(tax >= 0),
    discount REAL NOT NULL DEFAULT 0.0 CHECK(discount >= 0),
    line_total REAL NOT NULL DEFAULT 0.0 CHECK(line_total >= 0),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
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
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id ON purchase_order_items(product_id);
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
- `GET /api/inventory/item/:productId` — Single product balance
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

### Purchases (`/api/purchases`)
- `GET /api/purchases` — List purchase orders with search, status, supplier, date range, and pagination
- `GET /api/purchases/metrics` — Aggregate metrics (Total orders, drafts, ordered, received, cancelled, total spend)
- `GET /api/purchases/:id` — Get full PO details including line items and supplier contact
- `POST /api/purchases` — Create PO with line items (computes subtotal, tax, discount, grand total)
- `PUT /api/purchases/:id` — Update PO details and items while in `DRAFT` status
- `PATCH /api/purchases/:id/status` — Transition PO status (`DRAFT` -> `ORDERED` -> `CANCELLED`)
- `POST /api/purchases/:id/receive` — Receive items into physical inventory (delegates to `InventoryService.stockIn`, increments stock, creates immutable stock ledger entry, updates PO item received quantities and PO status to `PARTIALLY_RECEIVED` or `RECEIVED`)

---

## 7. Verification & Testing

The repository includes a comprehensive 71-test integration suite:
```powershell
# Run from backend directory:
npm test
```
**Current Test Coverage Breakdown (71/71 Passing):**
- **Tests 1–14**: Authentication, invalid passwords, email collision, profile isolation, bcrypt verification, role assignment.
- **Tests 15–24**: Category uniqueness, product creation, duplicate SKU rejection, price validation, search/filters, soft delete.
- **Tests 25–35**: Inventory initialization, Stock IN/OUT, negative stock prevention, adjustments, status state machines, ledger logging.
- **Tests 36–48**: Supplier registry CRUD, email collision, soft deactivation, catalog association/disassociation, RBAC protections.
- **Tests 49–59**: Customer registry CRUD, validation checks, duplicate email conflict, search & multi-parameter filtering, soft-deactivation state machine, RBAC authorization (SALES_MANAGER create/edit, VIEWER read-only).
- **Tests 60–71**: Purchase Management:
  - PO seeds and metrics aggregation.
  - Valid PO creation with active suppliers, products, and automatic financial calculations.
  - Validation: rejection of missing fields, inactive/non-existent suppliers, and quantity <= 0.
  - PO modification while in DRAFT status.
  - Status transition state machine (`DRAFT` -> `ORDERED`).
  - Partial receiving: increments item received quantity, updates PO status to `PARTIALLY_RECEIVED`, and increases physical inventory stock via authoritative `InventoryService.stockIn`.
  - Full receiving: updates PO status to `RECEIVED` and increments physical inventory stock.
  - Rejection of excess receiving beyond remaining order quantities.
  - Prevention of order cancellation once items have been received.
  - Multi-parameter search and status filtering.
  - RBAC protection: VIEWER forbidden from creating POs and receiving goods, while permitted read-only access.

---

## 8. Remaining Modules Roadmap (For Subsequent Sprints)

The planned remaining modules for the SCM project are:
1. **Module 7: Sales Management** *(Next to implement)*
   - Sales orders (SO generation: Customer selection, product items, quantity, selling price, discounts, taxes).
   - Order statuses: `DRAFT`, `CONFIRMED`, `PARTIALLY_DISPATCHED`, `DISPATCHED`, `CANCELLED`.
   - Outbound stock fulfillment: dispatching sales items invokes `InventoryService.stockOut` to reduce physical inventory balances and write audit ledger transactions with SO references.
   - Prevention of overselling / negative stock validation.
2. **Module 8: Invoices & Payments / Billing**
   - Invoicing for purchases (Accounts Payable) and sales (Accounts Receivable).
   - Payment status tracking (`UNPAID`, `PARTIAL`, `PAID`).
3. **Module 9: Dashboard & Reporting / Analytics**
   - Executive dashboard aggregating Inventory, Sales, Purchases, and Financial health.
   - Stock valuation, fast/slow moving items, turnover rate, and supplier performance.
4. **Module 10: Notifications & Activity Audit Trail**
   - Low stock notifications, out of stock alerts, order status notifications, global audit log.

---

## 9. Prompt to Hand Over to the Next Antigravity Session

Copy and paste the prompt in the box below to start Module 7 in Antigravity:

```markdown
Hello Antigravity! I am continuing development of our web-based Stock Management System (SCM project).

The previous developer completed Modules 1 through 6 (Authentication, Products, Inventory, Suppliers, Customers, and Purchase Management).
All 71 existing automated tests are passing in `backend/tests/run_tests.js`.
Full technical and architectural specifications are documented in `PROJECT_HANDOVER_SPEC.md` at the project root.

Please inspect the existing architecture, database schema (`backend/src/database/schema.sql`), and API patterns.

We are now ready to implement ONLY the next module:
👉 MODULE 7: SALES MANAGEMENT

Requirements:
- Follow all existing patterns (TypeScript, Express, node:sqlite, React, Tailwind).
- Maintain high cohesion, low coupling, soft-deactivation, and role-based permissions.
- Sales Management owns sales orders; physical stock depletion must delegate to `InventoryService.stockOut`.
- Do not break or regress any existing modules (preserve 71/71 tests and add new tests for Module 7).
- Please confirm you have inspected the project and are ready to implement Module 7.
```
