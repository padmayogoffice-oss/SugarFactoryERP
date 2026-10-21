/**
 * API router composition. Hand-written routers are mounted first for the
 * special-cased areas (auth, access control, navigation, dashboard, reports);
 * then a fully permission-checked CRUD router is generated for every remaining
 * registry submodule.
 */
import express from 'express';
import { buildResourceModels } from '../models/resourceModel.js';
import { modules } from '../registry/index.js';
import { entityRoutes } from './entities/index.js';
import { authenticate } from '../middlewares/auth.js';
import authRoutes from './authRoutes.js';
import accessRoutes from './accessRoutes.js';
import navigationRoutes from './navigationRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import reportRoutes from './reportRoutes.js';
import transliterationRoutes from './transliterationRoutes.js';

/**
 * Mounts one router per registry submodule at `/api/<module>/<submodule>`.
 * Routes are generated from the registry, so adding a submodule to the registry
 * immediately exposes a fully permission-checked REST resource.
 */
function buildApiRouter() {
  const api = express.Router();
  const resources = buildResourceModels();

  api.use('/auth', authRoutes);
  api.use('/access', accessRoutes);
  api.use('/navigation', navigationRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use('/reports', reportRoutes);
  api.use('/transliterate', transliterationRoutes);

  for (const moduleDef of modules) {
    if (moduleDef.key === 'access') continue; // handled by accessRoutes

    for (const submodule of moduleDef.submodules) {
      const entry = resources.get(submodule.key);
      const resourceRouter = entityRoutes.get(submodule.key);
      if (!entry || !resourceRouter) {
        throw new Error(`Missing model or route module for registry resource "${submodule.key}"`);
      }
      api.use(
        `/${moduleDef.key}/${submodule.key}`,
        resourceRouter,
      );
    }
  }

  api.get('/me', authenticate, (req, res) => res.json({ success: true, data: { id: String(req.user._id) } }));

  return api;
}

export { buildApiRouter };
