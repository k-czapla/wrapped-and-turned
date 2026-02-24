import type { Request, Response } from 'express';
import type { Env } from './env.js';
import { refreshAccessToken } from './ravelryOAuth2.js';

export interface AuthHelpers {
  ensureMockAuth(req: Request): void;
  ensureValidAccessToken(req: Request): Promise<void>;
  requireAuth(req: Request, res: Response): Promise<boolean>;
  getCallbackUrl(req: Request): string;
}

export function createAuth(env: Env, ravelryEnabled: boolean): AuthHelpers {
  function ensureMockAuth(req: Request) {
    req.session.ravelry ??= {
      accessToken: 'mock',
      refreshToken: 'mock',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      username: 'demo_user',
    };
  }

  async function ensureValidAccessToken(req: Request) {
    if (!ravelryEnabled) {
      ensureMockAuth(req);
      return;
    }

    if (!req.session.ravelry) return;

    // refresh a bit early
    const needsRefresh = Date.now() > req.session.ravelry.expiresAt - 2 * 60 * 1000;
    if (!needsRefresh) return;

    if (!req.session.ravelry.refreshToken) return;

    const refreshed = await refreshAccessToken({
      clientId: env.RAVELRY_CLIENT_ID!,
      clientSecret: env.RAVELRY_CLIENT_SECRET!,
      refreshToken: req.session.ravelry.refreshToken,
    });

    req.session.ravelry = {
      ...req.session.ravelry,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken,
      expiresAt: refreshed.expiresAt,
    };
  }

  async function requireAuth(req: Request, res: Response): Promise<boolean> {
    if (!ravelryEnabled) {
      ensureMockAuth(req);
      return true;
    }

    if (!req.session.ravelry) {
      res.status(401).json({ error: 'Not logged in' });
      return false;
    }

    await ensureValidAccessToken(req);
    return true;
  }

  function getCallbackUrl(req: Request) {
    const publicBase = env.PUBLIC_BACKEND_URL ?? `${req.protocol}://${req.get('host')}`;
    return `${publicBase}/auth/ravelry/callback`;
  }

  return { ensureMockAuth, ensureValidAccessToken, requireAuth, getCallbackUrl };
}
