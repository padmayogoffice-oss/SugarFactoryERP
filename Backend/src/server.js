/**
 * Process entry point: connects to MongoDB, starts the HTTP server and wires
 * graceful shutdown so in-flight requests finish and the DB connection closes
 * cleanly on SIGINT/SIGTERM.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/connectDB.js';
import { createApp } from './app.js';

async function start() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = Number(process.env.PORT || 4000);
  const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me';

  if (nodeEnv === 'production' && (
    jwtAccessSecret === 'dev-access-secret-change-me' ||
    jwtRefreshSecret === 'dev-refresh-secret-change-me'
  )) {
    throw new Error('Refusing to start in production with default JWT secrets. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.');
  }

  await connectDB();
  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`Sugar Factory ERP API listening on http://localhost:${port} (${nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    // Force-exit if connections refuse to drain, so a stuck socket cannot hang the process.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
