import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import axios from 'axios';
import { getEnv } from './env.js';
import { buildAuthorizeUrl, exchangeCodeForToken, makeState, refreshAccessToken } from './ravelryOAuth2.js';
import { makeRavelryApi, type RavelryCurrentUserResponse, type RavelryProjectsListResponse } from './ravelryApi.js';
import { computeBaseStats, mapWithConcurrency, safeDate } from './stats.js';

/** Stat keys that can be toggled for analysis. Default: all true. */
export const STAT_PREFERENCE_KEYS = [
  'projects',
  'finishedProjects',
  'totalYardage',
  'totalMeterage',
  'craftBreakdown',
  'mostProductiveMonth',
  'avgDurationDays',
  'projectsGallery',
] as const;

export type StatPreferenceKey = (typeof STAT_PREFERENCE_KEYS)[number];

export type StatPreferences = Partial<Record<StatPreferenceKey, boolean>>;

declare module 'express-session' {
  interface SessionData {
    ravelry?: {
      username?: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt: number;
    };
    oauthState?: string;
    /** Which Ravelry stats the user wants to be analyzed (shown). Default: all true. */
    statPreferences?: StatPreferences;
  }
}

const env = getEnv();
const ravelryEnabled =
  !env.MOCK_RAVELRY && !!env.RAVELRY_CLIENT_ID && !!env.RAVELRY_CLIENT_SECRET;

const app = express();
app.use(express.json());

// Render (and most managed hosts) run behind a proxy. Trusting it ensures:
// - req.protocol reflects HTTPS (when configured)
// - secure cookies work correctly
const isProd = env.FRONTEND_URL.startsWith('https://');
if (isProd) {
  app.set('trust proxy', 1);
}

const isCrossSite =
  !!env.PUBLIC_BACKEND_URL &&
  new URL(env.PUBLIC_BACKEND_URL).origin !== new URL(env.FRONTEND_URL).origin;

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // If frontend and backend are on different origins (common on Render),
      // session cookies must be SameSite=None and Secure to be sent on XHR/fetch.
      sameSite: isCrossSite ? 'none' : 'lax',
      secure: isCrossSite || isProd,
    },
  })
);

app.get('/health', (_req, res) => res.json({ ok: true, ravelryEnabled }));

function ensureMockAuth(req: express.Request) {
  req.session.ravelry ??= {
    accessToken: 'mock',
    refreshToken: 'mock',
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    username: 'demo_user',
  };
}

async function ensureValidAccessToken(req: express.Request) {
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

async function requireAuth(req: express.Request, res: express.Response): Promise<boolean> {
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

function getCallbackUrl(req: express.Request) {
  const publicBase = env.PUBLIC_BACKEND_URL ?? `${req.protocol}://${req.get('host')}`;
  return `${publicBase}/auth/ravelry/callback`;
}

app.get('/auth/ravelry/start', async (req, res) => {
  if (!ravelryEnabled) {
    ensureMockAuth(req);
    res.redirect(`${env.FRONTEND_URL}/wrapped`);
    return;
  }

  const state = makeState();
  req.session.oauthState = state;

  const redirectUri = getCallbackUrl(req);
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
    ensureMockAuth(req);
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

  const redirectUri = getCallbackUrl(req);
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

app.get('/api/me', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
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

function defaultStatPreferences(): Record<StatPreferenceKey, boolean> {
  const out = {} as Record<StatPreferenceKey, boolean>;
  for (const k of STAT_PREFERENCE_KEYS) {
    out[k] = true;
  }
  return out;
}

app.get('/api/stat-preferences', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
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

app.put('/api/stat-preferences', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
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

function mockWrapped(from: string, to: string) {
  return {
    range: { from, to },
    totals: {
      projects: 6,
      finishedProjects: 5,
      totalYardage: 2840,
      totalMeterage: 2595,
    },
    breakdowns: {
      craft: {
        Knitting: 4,
        Crochet: 2,
      },
    },
    highlights: {
      mostProductiveMonth: '2025-12',
      avgDurationDays: 18,
    },
    projects: [
      {
        id: 101,
        name: 'Cozy Ribbed Hat',
        craft: 'Knitting',
        yardage: 220,
        meterage: 200,
        patternName: 'The Classic Beanie',
        designerName: 'A. Designer',
      },
      {
        id: 102,
        name: 'Mosaic Cowl',
        craft: 'Knitting',
        yardage: 420,
        meterage: 385,
        patternName: 'Nightfall Cowl',
        designerName: 'B. Designer',
      },
      {
        id: 103,
        name: 'Granny Square Tote',
        craft: 'Crochet',
        yardage: 560,
        meterage: 510,
        patternName: 'Everyday Tote',
        designerName: 'C. Designer',
      },
    ],
  };
}

app.get('/api/wrapped', async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  const from = String(req.query.from ?? '');
  const to = String(req.query.to ?? '');
  if (!from || !to) {
    res.status(400).json({ error: 'Missing from/to (YYYY-MM-DD)' });
    return;
  }

  if (!ravelryEnabled) {
    res.json(mockWrapped(from, to));
    return;
  }

  const api = makeRavelryApi({ session: req.session.ravelry! });

  // NOTE: endpoint shape is kept in backend so frontend remains stable.
  const list = await api.getJson<RavelryProjectsListResponse>(
    `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/list.json`,
    {
      page_size: 100,
    }
  );

  const base = computeBaseStats({ from, to, items: list.projects ?? [] });

  const detailed = await mapWithConcurrency(base.inRange, 6, async (p) => {
    const detail = await api.getJson<any>(
      `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/${p.id}.json`
    );
    const proj = detail?.project ?? {};

    const firstPhoto = proj?.photos?.[0];
    const imageUrl: string | undefined =
      firstPhoto?.medium_url ?? firstPhoto?.small_url ?? firstPhoto?.thumbnail_url;

    const yardage: number | undefined = typeof proj?.yardage === 'number' ? proj.yardage : undefined;
    const meterage: number | undefined = typeof proj?.meterage === 'number' ? proj.meterage : undefined;

    const patternName: string | undefined = proj?.pattern_name ?? p.pattern_name;
    const designerName: string | undefined =
      proj?.pattern?.designer?.name ?? proj?.pattern?.designer_name;

    return {
      id: p.id,
      name: proj?.name ?? p.name ?? `Project #${p.id}`,
      completed: p.completed,
      started: p.started,
      craft: p.craft_name,
      yardage,
      meterage,
      patternName,
      designerName,
      imageUrl,
      url: p.permalink,
      _durationDays: (() => {
        const s = safeDate(p.started);
        const c = safeDate(p.completed);
        if (!s || !c) return undefined;
        return Math.max(0, Math.round((c.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      })(),
    };
  });

  const totalYardage = detailed.reduce((sum, p) => sum + (p.yardage ?? 0), 0);
  const totalMeterage = detailed.reduce((sum, p) => sum + (p.meterage ?? 0), 0);

  const durations = detailed
    .map((p) => p._durationDays)
    .filter((v): v is number => typeof v === 'number');
  const avgDurationDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : undefined;

  res.json({
    range: { from, to },
    totals: {
      projects: base.inRange.length,
      finishedProjects: base.inRange.filter((p) => !!p.completed).length,
      totalYardage,
      totalMeterage,
    },
    breakdowns: {
      craft: base.craft,
    },
    highlights: {
      mostProductiveMonth: base.mostProductiveMonth,
      avgDurationDays,
    },
    projects: detailed.map(({ _durationDays, ...p }) => p),
  });
});

app.get('/api/project-card/:id', async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  const projectId = Number(req.params.id);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: 'Invalid project id' });
    return;
  }

  if (!ravelryEnabled) {
    res.json({
      id: projectId,
      projectName: 'Demo Project',
      patternName: 'Demo Pattern',
      designerName: 'Demo Designer',
      sizeMade: 'One size',
      yarnUsed: 'Demo Yarn',
    });
    return;
  }

  const api = makeRavelryApi({ session: req.session.ravelry! });

  const detail = await api.getJson<any>(
    `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/${projectId}.json`
  );
  const proj = detail?.project ?? {};

  const firstPhoto = proj?.photos?.[0];
  const imageUrl: string | undefined =
    firstPhoto?.medium_url ?? firstPhoto?.small_url ?? firstPhoto?.thumbnail_url;

  const yarnUsed = Array.isArray(proj?.packs)
    ? proj.packs
      .map((p: any) => p?.yarn_name ?? p?.yarn?.name)
      .filter(Boolean)
      .join(', ')
    : undefined;

  res.json({
    id: projectId,
    imageUrl,
    projectName: proj?.name ?? `Project #${projectId}`,
    patternName: proj?.pattern_name,
    designerName: proj?.pattern?.designer?.name ?? proj?.pattern?.designer_name,
    sizeMade: proj?.size,
    yarnUsed,
  });
});

// Image proxy endpoint to avoid CORS issues when generating PNGs
app.get('/api/proxy-image', async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== 'string') {
    res.status(400).json({ error: 'Missing or invalid url parameter' });
    return;
  }

  // Only allow proxying Ravelry image URLs for security
  if (!imageUrl.includes('ravelrycache.com') && !imageUrl.includes('ravelry.com')) {
    res.status(400).json({ error: 'Only Ravelry image URLs are allowed' });
    return;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(Buffer.from(response.data));
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${env.PORT} (ravelryEnabled=${ravelryEnabled})`);
});
