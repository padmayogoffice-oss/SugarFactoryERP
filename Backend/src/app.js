/**
 * Express application factory. Kept separate from server.js so tests can build
 * an app instance without binding a port.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { buildApiRouter } from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { modules, permissionCatalog } from './registry/index.js';

function createApp() {
  const app = express();
  const nodeEnv = process.env.NODE_ENV || 'development';
  const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:12000,http://127.0.0.1:12000,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser requests have no Origin header.
        if (!origin || corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (nodeEnv !== 'test') {
    app.use(morgan(nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  // Health probe doubles as a registry sanity check: the module and permission
  // counts should always match the compiled registry.
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', modules: modules.length, permissions: permissionCatalog.length } });
  });

  app.use('/api', buildApiRouter());

  // Not-found must precede the error handler so thrown ApiErrors land in one place.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export { createApp };
