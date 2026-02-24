import type { Application } from 'express';
import type { RouteContext } from './context.js';

export function registerHealthRoutes(app: Application, ctx: RouteContext): void {
  app.get('/health', (_req, res) =>
    res.json({ ok: true, ravelryEnabled: ctx.ravelryEnabled })
  );
}
