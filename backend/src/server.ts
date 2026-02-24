import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import axios from 'axios';
import { getEnv } from './env.js';
import { buildAuthorizeUrl, exchangeCodeForToken, makeState, refreshAccessToken } from './ravelryOAuth2.js';
import {
  makeRavelryApi,
  type RavelryBundleShowResponse,
  type RavelryBundlesListResponse,
  type RavelryCurrentUserResponse,
  type RavelryProjectsListResponse,
} from './ravelryApi.js';
import { computeBaseStats, mapWithConcurrency, safeDate } from './stats.js';
import {
  buildFallbackDescription,
  buildFallbackPatternRoundUpDescription,
  callGroqForDescription,
  callGroqForPatternRoundUpDescription,
  type CardSummary,
  type PatternRoundUpSummary,
} from './generateDescription.js';
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

/** Prefer medium2_url when non-empty, else medium_url, small_url, thumbnail_url. */
function ravelryPhotoUrl(ph: {
  medium2_url?: string;
  medium_url?: string;
  small_url?: string;
  thumbnail_url?: string;
} | null | undefined): string | undefined {
  if (!ph) return undefined;
  const url =
    ph.medium2_url?.trim()
      ? ph.medium2_url
      : ph.medium_url ?? ph.small_url ?? ph.thumbnail_url;
  return url ?? undefined;
}

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
  const finishedIds = new Set(base.finishedInRange.map((p) => p.id));

  const detailed = await mapWithConcurrency(base.projectsInRange, 6, async (p) => {
    const detail = await api.getJson<any>(
      `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/${p.id}.json`
    );
    const proj = detail?.project ?? {};

    const firstPhoto = proj?.photos?.[0];
    const imageUrl: string | undefined = ravelryPhotoUrl(firstPhoto);

    const yardage: number | undefined = typeof proj?.yardage === 'number' ? proj.yardage : undefined;
    const meterage: number | undefined = typeof proj?.meterage === 'number' ? proj.meterage : undefined;

    const patternName: string | undefined = proj?.pattern_name ?? p.pattern_name;

    return {
      id: p.id,
      name: proj?.name ?? p.name ?? `Project #${p.id}`,
      completed: p.completed,
      started: p.started,
      craft: p.craft_name,
      yardage,
      meterage,
      patternName,
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

  const finishedDetailed = detailed.filter((p) => finishedIds.has(p.id));
  const totalYardage = finishedDetailed.reduce((sum, p) => sum + (p.yardage ?? 0), 0);
  const totalMeterage = finishedDetailed.reduce((sum, p) => sum + (p.meterage ?? 0), 0);

  const durations = finishedDetailed
    .map((p) => p._durationDays)
    .filter((v): v is number => typeof v === 'number');
  const avgDurationDays = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : undefined;

  res.json({
    range: { from, to },
    totals: {
      projects: base.projectsInRange.length,
      finishedProjects: base.finishedInRange.length,
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
      needleSizes: '4mm + 3.5mm',
      projectUrl: 'https://www.ravelry.com/projects/demo/example-project',
      projectPhotos: [],
      patternPhotos: [],
      started: '2025-01-15',
      completed: '2025-03-01',
    });
    return;
  }

  const api = makeRavelryApi({ session: req.session.ravelry! });

  const detail = await api.getJson<any>(
    `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/${projectId}.json`
  );
  const proj = detail?.project ?? {};

  const patternIdFromProject =
    proj?.pattern_id ?? proj?.pattern?.id ?? proj?.pattern?.pattern_id;
  let patternDetail: any = null;
  if (typeof patternIdFromProject === 'number' && Number.isFinite(patternIdFromProject)) {
    try {
      patternDetail = await api.getJson<any>(`/patterns/${patternIdFromProject}.json`);
    } catch {
      // Leave patternDetail null if pattern fetch fails
    }
  }

  const projectPhotos = (Array.isArray(proj?.photos) ? proj.photos : []).map((ph: any) =>
    ravelryPhotoUrl(ph)
  ).filter(Boolean);

  const pat =
    patternDetail?.pattern ??
    (Array.isArray(patternDetail?.patterns) ? patternDetail.patterns[0] : null);
  const patternPhotos = (pat && Array.isArray(pat?.photos) ? pat.photos : []).map((ph: any) =>
    ravelryPhotoUrl(ph)
  ).filter(Boolean);

  const firstPhoto = proj?.photos?.[0];
  let imageUrl: string | undefined = ravelryPhotoUrl(firstPhoto);

  if (imageUrl == null && patternDetail != null) {
    const patternFirstPhoto = pat?.photos?.[0];
    imageUrl = ravelryPhotoUrl(patternFirstPhoto);
  }

  const yarnUsed = Array.isArray(proj?.packs)
    ? proj.packs
      .map((p: any) => {
        const name = p?.yarn_name ?? p?.yarn?.name;
        const colorway = p?.colorway ?? p?.colorway_name ?? p?.yarn?.colorway;
        const parts = [name, colorway].filter(Boolean);
        return parts.length ? parts.join(' ') : null;
      })
      .filter(Boolean)
      .join(', ')
    : undefined;

  const needlesArray = proj?.needle_sizes ?? proj?.needles;
  const needleSizes = Array.isArray(needlesArray)
    ? [...new Set(
        needlesArray
          .map((n: any) => {
            const metric = n?.metric ?? n?.mm;
            const us = n?.us ?? n?.us_steel ?? n?.hook;
            const name = n?.name ?? n?.pretty_metric;
            if (typeof metric === 'number' && metric > 0) return `${metric}mm`;
            if (typeof us === 'string' && us.trim()) return `US ${us}`;
            if (typeof name === 'string' && name.trim()) return name.trim();
            return null;
          })
          .filter(Boolean)
      )].join(' + ') || undefined
    : undefined;

  const username = req.session.ravelry!.username ?? '';
  const permalink = proj?.permalink;
  const slug =
    typeof permalink === 'string' && permalink
      ? permalink.includes('/')
        ? permalink.replace(/^.*\//, '')
        : permalink
      : undefined;
  const projectUrl =
    username && slug
      ? `https://www.ravelry.com/projects/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`
      : undefined;

  let designerName: string | undefined;
  let patternName: string | undefined =
    proj?.pattern_name ?? proj?.pattern?.name;

  if (patternDetail != null) {
    const pat =
      patternDetail?.pattern ??
      (Array.isArray(patternDetail?.patterns) ? patternDetail.patterns[0] : {});
    designerName =
      patternDetail?.pattern_author?.name ?? pat?.pattern_author?.name ?? undefined;
    if (patternName == null || patternName === '') {
      patternName = pat?.name ?? undefined;
    }
  } else {
    designerName = undefined;
  }

  const debugLog = {
    ravelryProjectResponse: detail,
    ravelryPatternResponse: patternDetail,
  };

  const started =
    typeof proj?.started === 'string'
      ? proj.started
      : typeof proj?.started_at === 'string'
        ? proj.started_at
        : undefined;
  const completed =
    typeof proj?.completed === 'string'
      ? proj.completed
      : typeof proj?.completed_at === 'string'
        ? proj.completed_at
        : undefined;

  res.json({
    id: projectId,
    imageUrl,
    projectPhotos: projectPhotos.length ? projectPhotos : undefined,
    patternPhotos: patternPhotos.length ? patternPhotos : undefined,
    projectName: proj?.name ?? `Project #${projectId}`,
    patternName,
    designerName,
    sizeMade: proj?.size,
    yarnUsed,
    needleSizes,
    projectUrl,
    started: started || undefined,
    completed: completed || undefined,
    debugLog,
  });
});

// List user's bundles (Ravelry bundles_list)
app.get('/api/bundles', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const username = req.session.ravelry!.username ?? '';
  if (!username && !ravelryEnabled) {
    res.json({ bundles: [] });
    return;
  }
  if (!ravelryEnabled) {
    res.json({
      bundles: [
        { id: 1, name: 'Demo bundle', pattern_count: 2 },
        { id: 2, name: 'Favorites', pattern_count: 5 },
      ],
    });
    return;
  }
  const api = makeRavelryApi({ session: req.session.ravelry! });
  try {
    const data = await api.getJson<RavelryBundlesListResponse>(
      `/people/${encodeURIComponent(username)}/bundles/list.json`,
      { page_size: 100 }
    );
    const bundles = Array.isArray(data.bundles) ? data.bundles : [];
    res.json({ bundles });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Failed to load bundles' });
  }
});

/** Build a pattern card for Pattern Round Up from Ravelry pattern response. */
function buildPatternCardFromRavelry(pat: any, patternId: number): Record<string, unknown> {
  const photos = Array.isArray(pat?.photos) ? pat.photos : [];
  const patternPhotos = photos.map((ph: any) => ravelryPhotoUrl(ph)).filter(Boolean);
  const firstPhoto = photos[0];
  const imageUrl = ravelryPhotoUrl(firstPhoto);

  const designerName =
    pat?.pattern_author?.name ?? pat?.designer?.name ?? undefined;
  const patternName = pat?.name ?? `Pattern #${patternId}`;

  const sizesArr = Array.isArray(pat?.sizes) ? pat.sizes : [];
  const sizeNames = sizesArr.map((s: any) => s?.name ?? s?.size).filter(Boolean);
  const minCm = sizesArr.reduce(
    (acc: number | null, s: any) => {
      const v = s?.min_circumference_cm ?? s?.min_circumference;
      const n = typeof v === 'number' ? v : null;
      return n != null && (acc == null || n < acc) ? n : acc;
    },
    null as number | null
  );
  const maxCm = sizesArr.reduce(
    (acc: number | null, s: any) => {
      const v = s?.max_circumference_cm ?? s?.max_circumference;
      const n = typeof v === 'number' ? v : null;
      return n != null && (acc == null || n > acc) ? n : acc;
    },
    null as number | null
  );
  let sizesAvailable = sizeNames.length ? sizeNames.join(', ') : undefined;
  if (minCm != null || maxCm != null) {
    const minM = minCm != null ? (minCm / 100).toFixed(2) : '?';
    const maxM = maxCm != null ? (maxCm / 100).toFixed(2) : '?';
    const range = minCm != null && maxCm != null ? `${minM}–${maxM} m` : minCm != null ? `≥${minM} m` : `≤${maxM} m`;
    sizesAvailable = sizesAvailable ? `${sizesAvailable} (${range})` : range + ' circumference';
  }

  const needleArr = pat?.needle_sizes ?? pat?.pattern_needle_sizes ?? [];
  const needleSizes = Array.isArray(needleArr)
    ? [...new Set(
        needleArr
          .map((n: any) => {
            const metric = n?.metric ?? n?.mm;
            const us = n?.us ?? n?.us_steel ?? n?.hook;
            const name = n?.name ?? n?.pretty_metric;
            if (typeof metric === 'number' && metric > 0) return `${metric}mm`;
            if (typeof us !== 'undefined' && us !== null) return `US ${us}`;
            if (typeof name === 'string' && name.trim()) return name.trim();
            return null;
          })
          .filter(Boolean)
      )].join(' + ') || undefined
    : undefined;

  const gauge =
    typeof pat?.gauge === 'string' && pat.gauge.trim()
      ? pat.gauge.trim()
      : pat?.gauge_description?.trim() ?? undefined;

  const yarnWeights = pat?.yarn_weight ?? pat?.pattern_yarn_weights;
  let suggestedYarn: string | undefined;
  if (Array.isArray(yarnWeights) && yarnWeights.length > 0) {
    suggestedYarn = yarnWeights
      .map((y: any) => y?.name ?? y?.min_gauge ?? y?.ply ?? '')
      .filter(Boolean)
      .join(', ');
  } else if (yarnWeights && typeof yarnWeights === 'object' && yarnWeights.name) {
    suggestedYarn = String(yarnWeights.name);
  }

  const permalink = pat?.permalink;
  const patternUrl =
    typeof permalink === 'string' && permalink
      ? `https://www.ravelry.com/patterns/library/${permalink}`
      : `https://www.ravelry.com/patterns/library/${patternId}`;

  return {
    id: patternId,
    imageUrl,
    patternPhotos: patternPhotos.length ? patternPhotos : undefined,
    patternName,
    designerName,
    sizesAvailable: sizesAvailable ?? undefined,
    needleSizes,
    gauge,
    suggestedYarn,
    patternUrl,
  };
}

// Show bundle and return pattern cards (Ravelry bundles_show + pattern details)
app.get('/api/bundle/:id', async (req, res) => {
  if (!(await requireAuth(req, res))) return;
  const bundleId = Number(req.params.id);
  if (!Number.isFinite(bundleId)) {
    res.status(400).json({ error: 'Invalid bundle id' });
    return;
  }
  if (!ravelryEnabled) {
    res.json({
      bundle: { id: bundleId, name: 'Demo bundle' },
      patternCards: [
        {
          id: 101,
          patternName: 'Demo Pattern A',
          designerName: 'Designer A',
          sizesAvailable: 'S, M, L (0.80–1.20 m)',
          needleSizes: '4mm',
          gauge: '20 sts / 28 rows = 10 cm',
          suggestedYarn: 'DK',
          patternUrl: 'https://www.ravelry.com/patterns/library/demo-a',
          patternPhotos: [],
        },
        {
          id: 102,
          patternName: 'Demo Pattern B',
          designerName: 'Designer B',
          sizesAvailable: 'One size (1.00 m)',
          needleSizes: '3.5mm',
          gauge: '22 sts / 30 rows = 10 cm',
          suggestedYarn: 'Fingering',
          patternUrl: 'https://www.ravelry.com/patterns/library/demo-b',
          patternPhotos: [],
        },
      ],
    });
    return;
  }
  const api = makeRavelryApi({ session: req.session.ravelry! });
  try {
    const data = await api.getJson<RavelryBundleShowResponse>(
      `/bundles/${bundleId}.json`
    );
    const rawBundle = data?.bundle;
    const bundle = rawBundle ?? { id: bundleId, name: undefined, bundle_items: [] };
    const items = Array.isArray(bundle.bundle_items) ? bundle.bundle_items : [];
    const patternIds = items
      .map((item: { pattern_id?: number; pattern?: { id?: number } }) => item.pattern_id ?? item.pattern?.id)
      .filter((id: unknown): id is number => typeof id === 'number' && Number.isFinite(id));
    const uniqueIds = [...new Set(patternIds)];

    const patternCards = await mapWithConcurrency(uniqueIds, 4, async (patternId: number) => {
      try {
        const patternRes = await api.getJson<any>(`/patterns/${patternId}.json`);
        const pat = patternRes?.pattern ?? patternRes?.patterns?.[0] ?? {};
        return buildPatternCardFromRavelry(pat, patternId);
      } catch {
        return {
          id: patternId,
          patternName: `Pattern #${patternId}`,
          patternUrl: `https://www.ravelry.com/patterns/library/${patternId}`,
        };
      }
    });

    res.json({
      bundle: { id: bundle.id, name: bundle.name },
      patternCards,
    });
  } catch (err: any) {
    const status = err?.response?.status;
    const message = err?.response?.data?.error ?? err?.message ?? 'Failed to load bundle';
    if (status === 404) {
      res.status(404).json({ error: 'Bundle not found' });
      return;
    }
    if (status === 403) {
      res.status(403).json({ error: "You don't have access to this bundle" });
      return;
    }
    console.error('GET /api/bundle/:id error', { bundleId, status, message }, err);
    res.status(500).json({ error: message });
  }
});

// Generate YouTube/show-notes description (AI-assisted via Groq, fallback if unavailable)
app.post('/api/generate-description', async (req, res) => {
  if (!(await requireAuth(req, res))) return;

  const body = req.body;
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: 'Expected JSON body' });
    return;
  }

  const patternCardsRaw = body.patternCards;
  const isPatternRoundUp = Array.isArray(patternCardsRaw) && patternCardsRaw.length > 0;

  if (isPatternRoundUp) {
    const patterns: PatternRoundUpSummary[] = patternCardsRaw.map((p: any) => ({
      patternName: typeof p.patternName === 'string' ? p.patternName : String(p?.patternName ?? ''),
      designerName: typeof p.designerName === 'string' ? p.designerName : undefined,
      patternUrl: typeof p.patternUrl === 'string' ? p.patternUrl : undefined,
    }));
    const optionalPrompt =
      typeof body.optionalPrompt === 'string' ? body.optionalPrompt.trim() || undefined : undefined;
    let result: { title: string; description: string; ravelryLinks: string; hashtags: string };
    const apiKey = env.GROQ_API_KEY;
    if (apiKey) {
      const groqResult = await callGroqForPatternRoundUpDescription(apiKey, patterns, optionalPrompt);
      result = groqResult ?? buildFallbackPatternRoundUpDescription(patterns);
    } else {
      result = buildFallbackPatternRoundUpDescription(patterns);
    }
    res.json(result);
    return;
  }

  const cardsRaw = body.cards;
  if (!Array.isArray(cardsRaw) || cardsRaw.length === 0) {
    res.status(400).json({ error: 'At least one project (cards) or pattern (patternCards) is required' });
    return;
  }

  const cards: CardSummary[] = cardsRaw.map((c: any) => ({
    projectName: typeof c.projectName === 'string' ? c.projectName : String(c?.projectName ?? ''),
    patternName: typeof c.patternName === 'string' ? c.patternName : undefined,
    designerName: typeof c.designerName === 'string' ? c.designerName : undefined,
    projectUrl: typeof c.projectUrl === 'string' ? c.projectUrl : undefined,
  }));

  const optionalPrompt =
    typeof body.optionalPrompt === 'string' ? body.optionalPrompt.trim() || undefined : undefined;

  const foCount =
    typeof body.foCount === 'number' &&
    Number.isInteger(body.foCount) &&
    body.foCount >= 0 &&
    body.foCount <= cards.length
      ? body.foCount
      : undefined;

  let result: { title: string; description: string; ravelryLinks: string; hashtags: string };
  const apiKey = env.GROQ_API_KEY;
  if (apiKey) {
    const groqResult = await callGroqForDescription(apiKey, cards, optionalPrompt, foCount);
    result = groqResult ?? buildFallbackDescription(cards, foCount);
  } else {
    result = buildFallbackDescription(cards, foCount);
  }

  res.json(result);
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
