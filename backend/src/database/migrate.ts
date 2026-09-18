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

  // Seed standard roles if not existing
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

  // Seed default admin user if no users exist
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
}

// Allow direct execution
if (require.main === module) {
  runMigrations();
  console.log('[DB] Migration completed successfully.');
}
