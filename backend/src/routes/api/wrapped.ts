import type { Router } from 'express';
import { makeRavelryApi, type RavelryProjectsListResponse } from '../../ravelryApi.js';
import { ravelryPhotoUrl } from '../../ravelry-helpers.js';
import {
  computeBaseStats,
  isFroggedStatus,
  mapWithConcurrency,
  safeDate,
} from '../../stats.js';
import type { RouteContext } from '../context.js';

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
        statusName: 'Finished',
        craft: 'Knitting',
        yardage: 220,
        meterage: 200,
        patternName: 'The Classic Beanie',
        designerName: 'A. Designer',
      },
      {
        id: 102,
        name: 'Mosaic Cowl',
        statusName: 'In progress',
        craft: 'Knitting',
        yardage: 420,
        meterage: 385,
        patternName: 'Nightfall Cowl',
        designerName: 'B. Designer',
      },
      {
        id: 103,
        name: 'Granny Square Tote',
        statusName: 'Hibernating',
        craft: 'Crochet',
        yardage: 560,
        meterage: 510,
        patternName: 'Everyday Tote',
        designerName: 'C. Designer',
      },
    ],
  };
}

export function registerWrappedRoutes(router: Router, ctx: RouteContext): void {
  const { ravelryEnabled, auth } = ctx;

  router.get('/wrapped', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;

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

    const list = await api.getJson<RavelryProjectsListResponse>(
      `/projects/${encodeURIComponent(req.session.ravelry!.username ?? '')}/list.json`,
      { page_size: 100 }
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

      const statusName =
        typeof p.status_name === 'string' && p.status_name.trim()
          ? p.status_name.trim()
          : typeof proj?.status_name === 'string' && proj.status_name.trim()
            ? String(proj.status_name).trim()
            : undefined;

      return {
        id: p.id,
        name: proj?.name ?? p.name ?? `Project #${p.id}`,
        completed: p.completed,
        started: p.started,
        statusName,
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

    const visible = detailed.filter((p) => !isFroggedStatus(p.statusName));
    const finishedDetailed = visible.filter((p) => finishedIds.has(p.id));
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
        projects: visible.length,
        finishedProjects: finishedDetailed.length,
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
      projects: visible.map(({ _durationDays, ...p }) => p),
    });
  });
}
