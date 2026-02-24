import express from 'express';
import type { RouteContext } from '../context.js';
import { registerBundlesRoutes } from './bundles.js';
import { registerGenerateDescriptionRoutes } from './generate-description.js';
import { registerMeRoutes } from './me.js';
import { registerProjectCardRoutes } from './project-card.js';
import { registerProxyImageRoutes } from './proxy-image.js';
import { registerWrappedRoutes } from './wrapped.js';

export function createApiRouter(ctx: RouteContext): express.Router {
  const router = express.Router();
  registerMeRoutes(router, ctx);
  registerWrappedRoutes(router, ctx);
  registerProjectCardRoutes(router, ctx);
  registerBundlesRoutes(router, ctx);
  registerGenerateDescriptionRoutes(router, ctx);
  registerProxyImageRoutes(router, ctx);
  return router;
}
