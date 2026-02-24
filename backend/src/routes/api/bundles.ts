import type { Router } from 'express';
import {
  makeRavelryApi,
  type RavelryBundleShowResponse,
  type RavelryBundlesListResponse,
  type RavelryCurrentUserResponse,
} from '../../ravelryApi.js';
import {
  buildPatternCardFromRavelry,
  extractBundleItems,
  getEmbeddedPatternFromBundleItem,
  getPatternIdFromBundleItem,
} from '../../ravelry-helpers.js';
import type { RouteContext } from '../context.js';

export function registerBundlesRoutes(router: Router, ctx: RouteContext): void {
  const { ravelryEnabled, auth } = ctx;

  router.get('/bundles', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;
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

  router.get('/bundle/:id', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;
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
            price: 6.5,
            currency: 'USD',
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
            price: 9.6,
            currency: 'EUR',
          },
        ],
      });
      return;
    }
    const api = makeRavelryApi({ session: req.session.ravelry! });
    let username = req.session.ravelry!.username;
    if (!username && req.session.ravelry!.accessToken) {
      try {
        const currentUser = await api.getJson<RavelryCurrentUserResponse>('/current_user.json');
        username = currentUser?.user?.username;
        if (username) req.session.ravelry!.username = username;
      } catch {
        // keep username undefined
      }
    }
    if (!username || !username.trim()) {
      res.status(400).json({ error: 'User identity not available; try refreshing the page.' });
      return;
    }
    try {
      const data = await api.getJson<RavelryBundleShowResponse>(
        `/people/${encodeURIComponent(username)}/bundles/${bundleId}.json`
      );
      const rawBundle = data?.bundle;
      const bundle = rawBundle ?? { id: bundleId, name: undefined, bundled_items: [] };
      const items = extractBundleItems(bundle);
      type ItemEntry = { patternId: number; item: Record<string, unknown> };
      const entries: ItemEntry[] = [];
      const seen = new Set<number>();
      for (const raw of items) {
        const item = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
        const patternId = getPatternIdFromBundleItem(item);
        if (typeof patternId === 'number' && Number.isFinite(patternId) && !seen.has(patternId)) {
          seen.add(patternId);
          entries.push({ patternId, item });
        }
      }

      const rawPatternResponses: Record<number, unknown> = {};
      const patternCards = await Promise.all(
        entries.map(async ({ patternId, item }) => {
          const embedded = getEmbeddedPatternFromBundleItem(item);
          try {
            const patternRes = await api.getJson<any>(`/patterns/${patternId}.json`);
            rawPatternResponses[patternId] = patternRes;
            const pat = patternRes?.pattern ?? patternRes?.patterns?.[0] ?? {};
            if (pat && (pat.photos != null || pat.name != null)) {
              return buildPatternCardFromRavelry(pat, patternId);
            }
          } catch {
            // fall through to embedded or minimal fallback
          }
          if (embedded) {
            return buildPatternCardFromRavelry(embedded, patternId);
          }
          return {
            id: patternId,
            patternName: `Pattern #${patternId}`,
            patternUrl: `https://www.ravelry.com/patterns/library/${patternId}`,
          };
        })
      );

      res.json({
        bundle: { id: bundle.id, name: bundle.name },
        patternCards,
        _rawRavelry: data,
        _rawRavelryPatterns: rawPatternResponses,
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
}
