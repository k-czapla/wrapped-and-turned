import type { Router } from 'express';
import { makeRavelryApi, type RavelryCurrentUserResponse } from '../../ravelryApi.js';
import { STAT_PREFERENCE_KEYS, type StatPreferenceKey, type StatPreferences } from '../../session-types.js';
import type { RouteContext } from '../context.js';

function defaultStatPreferences(): Record<StatPreferenceKey, boolean> {
  const out = {} as Record<StatPreferenceKey, boolean>;
  for (const k of STAT_PREFERENCE_KEYS) {
    out[k] = true;
  }
  return out;
}

export function registerMeRoutes(router: Router, ctx: RouteContext): void {
  const { env, ravelryEnabled, auth } = ctx;

  router.get('/me', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;
    let username = req.session.ravelry!.username;
    if (!username && ravelryEnabled && req.session.ravelry!.accessToken) {
      try {
        const api = makeRavelryApi({ session: req.session.ravelry! });
        const currentUser = await api.getJson<RavelryCurrentUserResponse>('/current_user.json');
        username = currentUser?.user?.username;
        if (username) req.session.ravelry!.username = username;
      } catch {
        // keep username undefined, fallback below
      }
    }
    res.json({ username: username ?? 'ravelry-user' });
  });

  router.get('/stat-preferences', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;
    const defaults = defaultStatPreferences();
    const stored = req.session.statPreferences ?? {};
    const merged: Record<StatPreferenceKey, boolean> = { ...defaults };
    for (const k of STAT_PREFERENCE_KEYS) {
      if (typeof stored[k] === 'boolean') {
        merged[k] = stored[k];
      }
    }
    res.json(merged);
  });

  router.put('/stat-preferences', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;
    const body = req.body;
    if (!body || typeof body !== 'object') {
      res.status(400).json({ error: 'Expected JSON object' });
      return;
    }
    const next: StatPreferences = { ...req.session.statPreferences };
    for (const k of STAT_PREFERENCE_KEYS) {
      if (typeof body[k] === 'boolean') {
        next[k] = body[k];
      }
    }
    req.session.statPreferences = next;
    res.json(next);
  });
}
