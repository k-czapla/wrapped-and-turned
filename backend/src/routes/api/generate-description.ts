import type { Router } from 'express';
import {
  buildFallbackDescription,
  buildFallbackPatternRoundUpDescription,
  callGroqForDescription,
  callGroqForPatternRoundUpDescription,
  type CardSummary,
  type PatternRoundUpSummary,
} from '../../generateDescription.js';
import type { RouteContext } from '../context.js';

export function registerGenerateDescriptionRoutes(router: Router, ctx: RouteContext): void {
  const { env, auth } = ctx;

  router.post('/generate-description', async (req, res) => {
    if (!(await auth.requireAuth(req, res))) return;

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
}
