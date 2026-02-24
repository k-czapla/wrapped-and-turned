import type { Application } from 'express';
import { buildAuthorizeUrl, exchangeCodeForToken, makeState } from '../ravelryOAuth2.js';
import { makeRavelryApi, type RavelryCurrentUserResponse } from '../ravelryApi.js';
import type { RouteContext } from './context.js';

export function registerAuthRoutes(app: Application, ctx: RouteContext): void {
  const { env, ravelryEnabled, auth } = ctx;

  app.get('/auth/ravelry/start', async (req, res) => {
    if (!ravelryEnabled) {
      auth.ensureMockAuth(req);
      res.redirect(`${env.FRONTEND_URL}/wrapped`);
      return;
    }

    const state = makeState();
    req.session.oauthState = state;

    const redirectUri = auth.getCallbackUrl(req);
    const authUrl = buildAuthorizeUrl({
      clientId: env.RAVELRY_CLIENT_ID!,
      redirectUri,
      scope: env.RAVELRY_SCOPES,
      state,
    });

    res.redirect(authUrl);
  });

  app.get('/auth/ravelry/callback', async (req, res) => {
    if (!ravelryEnabled) {
      auth.ensureMockAuth(req);
      res.redirect(`${env.FRONTEND_URL}/wrapped`);
      return;
    }

    const code = String(req.query.code ?? '');
    const state = String(req.query.state ?? '');

    if (!code) {
      res.status(400).send('Missing code');
      return;
    }

    if (!state || state !== req.session.oauthState) {
      res.status(400).send('Invalid state. Please retry login.');
      return;
    }

    const redirectUri = auth.getCallbackUrl(req);
    const tokens = await exchangeCodeForToken({
      clientId: env.RAVELRY_CLIENT_ID!,
      clientSecret: env.RAVELRY_CLIENT_SECRET!,
      code,
      redirectUri,
    });

    const sessionWithTokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    };
    const api = makeRavelryApi({ session: sessionWithTokens });
    const currentUser = await api.getJson<RavelryCurrentUserResponse>('/current_user.json');
    const username = currentUser?.user?.username;

    req.session.ravelry = {
      ...sessionWithTokens,
      ...(username && { username }),
    };
    req.session.oauthState = undefined;

    res.redirect(`${env.FRONTEND_URL}/wrapped`);
  });

  app.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });
}
