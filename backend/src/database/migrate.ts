import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from './connection';
import { config } from '../config/env';

export function runMigrations() {
  console.log('[DB] Running database migrations...');
  let schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/database/schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  
  db.exec(schemaSql);
  console.log('[DB] Schema verified.');

  // 1. Seed standard roles if not existing
  const roles = [
    { id: 'role_admin', name: 'ADMIN', description: 'Full system administration and user management' },
    { id: 'role_inventory', name: 'INVENTORY_MANAGER', description: 'Manage products, stock tracking, and adjustments' },
    { id: 'role_sales', name: 'SALES_MANAGER', description: 'Manage sales orders, customers, and outbound shipments' },
    { id: 'role_purchase', name: 'PURCHASE_MANAGER', description: 'Manage purchases, suppliers, and inbound shipments' },
    { id: 'role_viewer', name: 'VIEWER', description: 'Read-only access across inventory and transaction reports' },
  ];

  const insertRoleStmt = db.prepare(`
    INSERT INTO roles (id, name, description, created_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(name) DO UPDATE SET description = excluded.description
  `);

  for (const role of roles) {
    insertRoleStmt.run(role.id, role.name, role.description);
  }
  console.log('[DB] Core roles seeded.');

  // 2. Seed default admin user if no users exist
  const countUsersStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const result = countUsersStmt.get() as any;
  const count = result ? result.count : 0;

  if (count === 0) {
    console.log('[DB] No users found. Seeding initial System Administrator...');
    const adminRoleRow = db.prepare("SELECT id FROM roles WHERE name = 'ADMIN'").get() as any;
    const adminRoleId = adminRoleRow.id;
    const defaultPasswordHash = bcrypt.hashSync('Admin@123456', config.BCRYPT_SALT_ROUNDS);
    
    db.prepare(`
      INSERT INTO users (id, full_name, email, password_hash, role_id, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      'usr_default_admin',
      'System Administrator',
      'admin@stockit.local',
      defaultPasswordHash,
      adminRoleId,
      'ACTIVE'
    );
    console.log('[DB] Default admin seeded: admin@stockit.local / Admin@123456');
  }

  // 3. Seed initial standard categories if none exist
  const countCategoriesStmt = db.prepare('SELECT COUNT(*) as count FROM categories');
  const catResult = countCategoriesStmt.get() as any;
  const catCount = catResult ? catResult.count : 0;

  if (catCount === 0) {
    console.log('[DB] No categories found. Seeding standard product categories...');
    const defaultCategories = [
      { id: 'cat_electronics', name: 'Electronics', description: 'Electronic devices, accessories, and components' },
      { id: 'cat_office', name: 'Office Supplies', description: 'Stationery, paper, desk supplies, and office materials' },
      { id: 'cat_raw', name: 'Raw Materials', description: 'Production and manufacturing inputs' },
      { id: 'cat_packaging', name: 'Packaging', description: 'Boxes, bubble wrap, tape, and shipping materials' },
      { id: 'cat_finished', name: 'Finished Goods', description: 'Ready-to-sell inventory items' },
    ];

    const insertCatStmt = db.prepare(`
      INSERT INTO categories (id, name, description, status, created_at, updated_at)
      VALUES (?, ?, ?, 'ACTIVE', datetime('now'), datetime('now'))
      ON CONFLICT(name) DO NOTHING
    `);

    for (const cat of defaultCategories) {
      insertCatStmt.run(cat.id, cat.name, cat.description);
    }
    console.log('[DB] Default categories seeded.');
  }

  // 4. Initialize inventory records for products that do not have an inventory record
  const syncInventoryStmt = db.prepare(`
    INSERT INTO inventory (id, product_id, current_quantity, created_at, updated_at)
    SELECT 
      'inv_' || p.id,
      p.id,
      COALESCE(p.opening_stock, 0),
      datetime('now'),
      datetime('now')
    FROM products p
    LEFT JOIN inventory inv ON p.id = inv.product_id
    WHERE inv.id IS NULL
  `);
  syncInventoryStmt.run();
  console.log('[DB] Inventory balances initialized for products.');

  // 5. Seed initial suppliers if none exist
  const countSuppliersStmt = db.prepare('SELECT COUNT(*) as count FROM suppliers');
  const supplierResult = countSuppliersStmt.get() as any;
  const supplierCount = supplierResult ? supplierResult.count : 0;

  if (supplierCount === 0) {
    console.log('[DB] No suppliers found. Seeding standard suppliers...');
    const defaultSuppliers = [
      {
        id: 'sup_prime_tech',
        supplier_name: 'Prime Tech Distributors',
        company_name: 'Prime Technologies Pvt Ltd',
        email: 'sales@primetech.local',
        phone: '+91 98765 43210',
        alternate_phone: '+91 98765 43211',
        address: '42 Industrial Tech Park, Electronic City',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postal_code: '560100',
        tax_number: '29ABCDE1234F1Z5',
        contact_person: 'Rajesh Sharma (Key Account Manager)',
        notes: 'Primary hardware & electronics distributor. Standard lead time: 3-5 business days.',
        status: 'ACTIVE',
      },
      {
        id: 'sup_apex_stationery',
        supplier_name: 'Apex Office Supplies & Paper',
        company_name: 'Apex Global Logistics Inc',
        email: 'orders@apexsupplies.local',
        phone: '+91 91234 56789',
        alternate_phone: null,
        address: '77 Commerce Hub, Nariman Point',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400021',
        tax_number: '27AABCA5678G2Z1',
        contact_person: 'Pooja Varma (Procurement Head)',
        notes: 'Bulk stationery, cartons, and paper supplier. Payment terms: Net 30.',
        status: 'ACTIVE',
      },
      {
        id: 'sup_global_raw',
        supplier_name: 'Global Raw Materials Corp',
        company_name: 'Global Polychem Materials Ltd',
        email: 'contact@globalpolychem.local',
        phone: '+91 99887 76655',
        alternate_phone: null,
        address: '104 GIDC Phase II, Vatva',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        postal_code: '382445',
        tax_number: '24AAACG9988H1Z8',
        contact_person: 'Amitabh Patel (Sales Director)',
        notes: 'Polymers, packaging pellets, and industrial consumables supplier.',
        status: 'ACTIVE',
      },
    ];

    const insertSupStmt = db.prepare(`
      INSERT INTO suppliers (
        id, supplier_name, company_name, email, phone, alternate_phone,
        address, city, state, country, postal_code, tax_number,
        contact_person, notes, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, datetime('now'), datetime('now')
      )
    `);

    for (const s of defaultSuppliers) {
      insertSupStmt.run(
        s.id, s.supplier_name, s.company_name, s.email, s.phone, s.alternate_phone,
        s.address, s.city, s.state, s.country, s.postal_code, s.tax_number,
        s.contact_person, s.notes, s.status
      );
    }
    console.log('[DB] Standard suppliers seeded.');
  }

  // 6. Seed default customers if none exist
  const countCustStmt = db.prepare('SELECT COUNT(*) as count FROM customers');
  const custResult = countCustStmt.get() as any;
  const custCount = custResult ? custResult.count : 0;

  if (custCount === 0) {
    console.log('[DB] No customers found. Seeding standard customers...');
    const defaultCustomers = [
      {
        id: 'cust_apex_retail',
        customer_name: 'Priya Sharma',
        company_name: 'Apex Retail Solutions',
        email: 'priya.sharma@apexretail.local',
        phone: '+91 98450 12345',
        alternate_phone: '+91 98450 12346',
        address: '12 Brigade Road, Ashok Nagar',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        postal_code: '560025',
        tax_number: '29AAAAA0000A1Z5',
        notes: 'Premium commercial client. Preferred payment terms: Net 15.',
        status: 'ACTIVE',
      },
      {
        id: 'cust_nexus_tech',
        customer_name: 'Rahul Deshmukh',
        company_name: 'Nexus Technologies Pvt Ltd',
        email: 'rahul.d@nexustech.local',
        phone: '+91 97654 32100',
        alternate_phone: null,
        address: '801 Infinity IT Park, Malad West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        postal_code: '400064',
        tax_number: '27BBBBB1111B1Z2',
        notes: 'Corporate electronics & peripherals bulk buyer.',
        status: 'ACTIVE',
      },
      {
        id: 'cust_metro_super',
        customer_name: 'Sunita Nair',
        company_name: 'Metro Retail Mart Ltd',
        email: 'sunita.nair@metromart.local',
        phone: '+91 94440 98765',
        alternate_phone: null,
        address: '45 Mount Road, T. Nagar',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        postal_code: '600017',
        tax_number: '33CCCCC2222C1Z9',
        notes: 'Weekly packaging and consumables orders.',
        status: 'ACTIVE',
      },
    ];

    const insertCustStmt = db.prepare(`
      INSERT INTO customers (
        id, customer_name, company_name, email, phone, alternate_phone,
        address, city, state, country, postal_code, tax_number,
        notes, status, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, datetime('now'), datetime('now')
      )
    `);

    for (const c of defaultCustomers) {
      insertCustStmt.run(
        c.id, c.customer_name, c.company_name, c.email, c.phone, c.alternate_phone,
        c.address, c.city, c.state, c.country, c.postal_code, c.tax_number,
        c.notes, c.status
      );
    }
    console.log('[DB] Standard customers seeded.');
  }

  // 7. Seed standard purchase orders if none exist and products/suppliers exist
  const countPOStmt = db.prepare('SELECT COUNT(*) as count FROM purchase_orders');
  const poResult = countPOStmt.get() as any;
  const poCount = poResult ? poResult.count : 0;

  if (poCount === 0) {
    const adminUser = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    const adminId = adminUser ? adminUser.id : 'usr_default_admin';
    const supplierRow = db.prepare("SELECT id FROM suppliers LIMIT 1").get() as any;
    const products = db.prepare("SELECT id, purchase_price FROM products LIMIT 2").all() as any[];

    if (supplierRow && products.length > 0) {
      console.log('[DB] No purchase orders found. Seeding initial purchase order...');
      const poId = 'po_seed_001';
      const p1 = products[0];
      const p2 = products[1] || products[0];
      const qty1 = 20;
      const qty2 = 10;
      const price1 = Number(p1.purchase_price) || 50;
      const price2 = Number(p2.purchase_price) || 30;
      const total1 = qty1 * price1;
      const total2 = qty2 * price2;
      const subtotal = total1 + total2;
      const tax = Math.round(subtotal * 0.05 * 100) / 100;
      const total = subtotal + tax;

      db.prepare(`
        INSERT INTO purchase_orders (
          id, supplier_id, order_date, expected_delivery_date, status,
          subtotal, tax, discount, total, notes, created_by, created_at, updated_at
        ) VALUES (
          ?, ?, date('now'), date('now', '+7 days'), 'ORDERED',
          ?, ?, 0, ?, 'Initial restock purchase order for standard inventory items.', ?, datetime('now'), datetime('now')
        )
      `).run(poId, supplierRow.id, subtotal, tax, total, adminId);

      const insertItemStmt = db.prepare(`
        INSERT INTO purchase_order_items (
          id, purchase_order_id, product_id, quantity, received_quantity,
          unit_price, tax, discount, line_total, created_at
        ) VALUES (?, ?, ?, ?, 0, ?, 0, 0, ?, datetime('now'))
      `);

      insertItemStmt.run('poi_seed_001', poId, p1.id, qty1, price1, total1);
      if (products.length > 1) {
        insertItemStmt.run('poi_seed_002', poId, p2.id, qty2, price2, total2);
      }
      console.log('[DB] Standard purchase order seeded.');
    }
  }

  // 8. Seed standard sales orders if none exist and products/customers exist
  const countSOStmt = db.prepare('SELECT COUNT(*) as count FROM sales_orders');
  const soResult = countSOStmt.get() as any;
  const soCount = soResult ? soResult.count : 0;

  if (soCount === 0) {
    const adminUser = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    const adminId = adminUser ? adminUser.id : 'usr_default_admin';
    const customerRow = db.prepare("SELECT id FROM customers WHERE status = 'ACTIVE' LIMIT 1").get() as any;
    const products = db.prepare("SELECT id, selling_price FROM products WHERE status = 'ACTIVE' LIMIT 2").all() as any[];

    if (customerRow && products.length > 0) {
      console.log('[DB] No sales orders found. Seeding initial sales order...');
      const soId = 'so_seed_001';
      const orderNumber = 'SO-2026-0001';
      const p1 = products[0];
      const p2 = products[1] || products[0];
      const qty1 = 5;
      const qty2 = 2;
      const price1 = Number(p1.selling_price) || 80;
      const price2 = Number(p2.selling_price) || 50;
      const total1 = qty1 * price1;
      const total2 = qty2 * price2;
      const subtotal = total1 + total2;
      const tax = Math.round(subtotal * 0.08 * 100) / 100;
      const total = subtotal + tax;

      db.prepare(`
        INSERT INTO sales_orders (
          id, order_number, customer_id, order_date, status,
          subtotal, tax, discount, total, notes, created_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, date('now'), 'CONFIRMED',
          ?, ?, 0, ?, 'Standard customer retail order awaiting delivery fulfillment.', ?, datetime('now'), datetime('now')
        )
      `).run(soId, orderNumber, customerRow.id, subtotal, tax, total, adminId);

      const insertSOItemStmt = db.prepare(`
        INSERT INTO sales_order_items (
          id, sales_order_id, product_id, quantity,
          unit_price, tax, discount, line_total, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, 0, ?, datetime('now'))
      `);

      insertSOItemStmt.run('soi_seed_001', soId, p1.id, qty1, price1, total1);
      if (products.length > 1) {
        insertSOItemStmt.run('soi_seed_002', soId, p2.id, qty2, price2, total2);
      }
      console.log('[DB] Standard sales order seeded.');
    }
  }

  // 9. Seed standard invoice if none exist and sales order exists
  const countInvStmt = db.prepare('SELECT COUNT(*) as count FROM invoices');
  const invResult = countInvStmt.get() as any;
  const invCount = invResult ? invResult.count : 0;

  if (invCount === 0) {
    const adminUser = db.prepare("SELECT id FROM users LIMIT 1").get() as any;
    const adminId = adminUser ? adminUser.id : 'usr_default_admin';
    const soRow = db.prepare("SELECT * FROM sales_orders LIMIT 1").get() as any;

    if (soRow) {
      console.log('[DB] No invoices found. Seeding initial invoice...');
      const invId = 'inv_seed_001';
      const invoiceNumber = 'INV-2026-0001';
      const soItems = db.prepare("SELECT * FROM sales_order_items WHERE sales_order_id = ?").all(soRow.id) as any[];

      db.prepare(`
        INSERT INTO invoices (
          id, invoice_number, sales_order_id, customer_id, invoice_date, due_date, status,
          subtotal, tax, discount, total, notes, created_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, date('now'), date('now', '+30 days'), 'ISSUED',
          ?, ?, ?, ?, 'Initial commercial invoice for customer fulfillment.', ?, datetime('now'), datetime('now')
        )
      `).run(invId, invoiceNumber, soRow.id, soRow.customer_id, soRow.subtotal, soRow.tax, soRow.discount, soRow.total, adminId);

      const insertInvItemStmt = db.prepare(`
        INSERT INTO invoice_items (
          id, invoice_id, product_id, description, quantity,
          unit_price, tax, discount, line_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);

      for (let i = 0; i < soItems.length; i++) {
        const item = soItems[i];
        const p = db.prepare("SELECT name FROM products WHERE id = ?").get(item.product_id) as any;
        const desc = p ? p.name : 'Product line item';
        insertInvItemStmt.run(
          `invi_seed_${String(i + 1).padStart(3, '0')}`,
          invId,
          item.product_id,
          desc,
          item.quantity,
          item.unit_price,
          item.tax,
          item.discount,
          item.line_total
        );
      }
      console.log('[DB] Standard commercial invoice seeded.');
    }
  }
}

// Allow direct execution
if (require.main === module) {
  runMigrations();
  console.log('[DB] Migration completed successfully.');
}
