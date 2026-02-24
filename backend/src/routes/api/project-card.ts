import type { Router } from 'express';
import { makeRavelryApi } from '../../ravelryApi.js';
import { ravelryPhotoUrl } from '../../ravelry-helpers.js';
import type { RouteContext } from '../context.js';

export function registerProjectCardRoutes(router: Router, ctx: RouteContext): void {
  const { ravelryEnabled, auth } = ctx;

  router.get('/project-card/:id', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;

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
}
