import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Port 5001 avoids collisions with Docker Desktop/WSL relay which occupies 5000 on Windows
  PORT: parseInt(process.env.PORT || '5001', 10),
  JWT_SECRET: process.env.JWT_SECRET || 'scm_stock_management_jwt_super_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  DB_FILE: process.env.DB_FILE || path.resolve(__dirname, '../../data/stock_management.db'),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
