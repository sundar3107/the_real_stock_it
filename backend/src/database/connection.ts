import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';

// Ensure data directory exists
const dbDir = path.dirname(config.DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database instance using Node's native engine
export const db = new DatabaseSync(config.DB_FILE);

// Enforce foreign key constraints and enable WAL mode for high concurrency
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

export default db;
