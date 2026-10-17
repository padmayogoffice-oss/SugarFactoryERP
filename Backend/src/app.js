const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const env = require('./config/env');
const { buildApiRouter } = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { modules, permissionCatalog } = require('./registry');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser requests have no Origin header.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origin not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok', modules: modules.length, permissions: permissionCatalog.length } });
  });

  app.use('/api', buildApiRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
