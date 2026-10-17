/**
 * API router composition. Hand-written routers are mounted first for the
 * special-cased areas (auth, access control, navigation, dashboard, reports);
 * then a fully permission-checked CRUD router is generated for every remaining
 * registry submodule.
 */
const express = require('express');
const { buildResourceModels } = require('../models/resourceModel');
const { modules } = require('../registry');
const { createResourceRouter } = require('./resourceRouter');
const { authenticate } = require('../middleware/auth');

/**
 * Mounts one router per registry submodule at `/api/<module>/<submodule>`.
 * Routes are generated from the registry, so adding a submodule to the registry
 * immediately exposes a fully permission-checked REST resource.
 */
function buildApiRouter() {
  const api = express.Router();
  const resources = buildResourceModels();

  api.use('/auth', require('./authRoutes'));
  api.use('/access', require('./accessRoutes'));
  api.use('/navigation', require('./navigationRoutes'));
  api.use('/dashboard', require('./dashboardRoutes'));
  api.use('/reports', require('./reportRoutes'));

  for (const moduleDef of modules) {
    if (moduleDef.key === 'access') continue; // handled by accessRoutes

    for (const submodule of moduleDef.submodules) {
      const entry = resources.get(submodule.key);
      if (!entry) continue;
      api.use(
        `/${moduleDef.key}/${submodule.key}`,
        createResourceRouter({ model: entry.model, submodule, module: moduleDef }),
      );
    }
  }

  api.get('/me', authenticate, (req, res) => res.json({ success: true, data: { id: String(req.user._id) } }));

  return api;
}

module.exports = { buildApiRouter };
