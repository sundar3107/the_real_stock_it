import { createApp } from './app';
import { config } from './config/env';
import { runMigrations } from './database/migrate';

function bootstrap() {
  try {
    // 1. Initialize and migrate database
    runMigrations();

    // 2. Instantiate Express application
    const app = createApp();

    // 3. Start HTTP server
    app.listen(config.PORT, () => {
      console.log(`====================================================`);
      console.log(` Stock Management System - Backend Service Running`);
      console.log(` Environment : ${config.NODE_ENV}`);
      console.log(` Port        : ${config.PORT}`);
      console.log(` Health Check: http://localhost:${config.PORT}/api/health`);
      console.log(` Auth Routes : http://localhost:${config.PORT}/api/auth`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();
