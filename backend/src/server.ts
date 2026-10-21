import { createApp } from './app';
import { config } from './config/env';
import { runMigrations } from './database/migrate';

function startServer(port: number, attemptFallback = true) {
  const app = createApp();
  const server = app.listen(port, () => {
    console.log(`====================================================`);
    console.log(` Stock Management System - Backend Service Running`);
    console.log(` Environment : ${config.NODE_ENV}`);
    console.log(` Port        : ${port}`);
    console.log(` Health Check: http://localhost:${port}/api/health`);
    console.log(` Auth Routes : http://localhost:${port}/api/auth`);
    console.log(`====================================================`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && attemptFallback) {
      const nextPort = port + 1;
      console.warn(`[WARN] Port ${port} is already in use. Falling back to port ${nextPort}...`);
      startServer(nextPort, false);
    } else {
      console.error('Fatal error during server startup:', err);
      process.exit(1);
    }
  });
}

function bootstrap() {
  try {
    // 1. Initialize and migrate database
    runMigrations();

    // 2. Start HTTP server
    startServer(config.PORT);
  } catch (error) {
    console.error('Fatal error during application startup:', error);
    process.exit(1);
  }
}

bootstrap();
