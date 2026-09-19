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
}

// Allow direct execution
if (require.main === module) {
  runMigrations();
  console.log('[DB] Migration completed successfully.');
}
