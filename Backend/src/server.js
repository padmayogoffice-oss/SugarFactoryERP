/**
 * Process entry point: connects to MongoDB, starts the HTTP server and wires
 * graceful shutdown so in-flight requests finish and the DB connection closes
 * cleanly on SIGINT/SIGTERM.
 */
const env = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { createApp } = require('./app');

async function start() {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.port, () => {
    console.log(`Sugar Factory ERP API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
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
