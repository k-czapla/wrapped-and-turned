import Groq from 'groq-sdk';

export type CardSummary = {
  projectName: string;
  patternName?: string;
  designerName?: string;
  projectUrl?: string;
};

/** Summary for pattern round up description (pattern URLs, not project URLs). */
export type PatternRoundUpSummary = {
  patternName: string;
  designerName?: string;
  patternUrl?: string;
};

export type DescriptionResult = {
  title: string;
  description: string;
  ravelryLinks: string;
  hashtags: string;
};

/** Assemble YouTube title from format: Ep. [##] | ## FOs - #catchy title# - Knitting Podcast #cozy emoji# */
export function buildTitle(foCount: number, catchyTitle: string, emoji: string): string {
  return `Ep. [##] | ${foCount} FOs - ${catchyTitle} - Knitting Podcast ${emoji}`.trim();
}

/**
 * Build non-AI fallback when Groq is unavailable or fails.
 * @param foCount - Number of selected projects that are finished objects (completed in range). If omitted, uses cards.length.
 */
export function buildFallbackDescription(
  cards: CardSummary[],
  foCount?: number
): DescriptionResult {
  const count = resolveFoCount(cards, foCount);
  if (cards.length === 0) {
    return {
      title: buildTitle(0, 'My fiber arts FOs', '✨'),
      description: 'In this episode I share these finished objects! ✨',
      ravelryLinks: '',
      hashtags: '#knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast',
    };
  }

  const first = cards[0];
  const oneTitle = first.patternName || first.projectName;
  const catchyTitle =
    cards.length === 1
      ? oneTitle
      : `${cards.map((c) => c.patternName || c.projectName).slice(0, 2).join(', ')}${cards.length > 2 ? '…' : ''}`;
  const title = buildTitle(count, catchyTitle, '✨');
  const description =
    count === 1
      ? `In this episode I'm sharing my finished object: ${oneTitle}. 🎙️`
      : `In this episode I'm sharing ${count} finished objects from my Ravelry! ✨`;

  const ravelryLinks = cards
    .filter((c) => c.projectUrl)
    .map((c) => {
      const label = [c.patternName || c.projectName, c.designerName].filter(Boolean).join(' by ');
      return `- ${label}: ${c.projectUrl}`;
    })
    .join('\n');

  const hashtags =
    '#knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #yarntogether #craft';

  return { title, description, ravelryLinks, hashtags };
}

/** Title format for pattern round up: Ep. [##] | Pattern Round Up - #title# - Knitting Podcast #emoji# */
export function buildPatternRoundUpTitle(catchyTitle: string, emoji: string): string {
  return `Ep. [##] | Pattern Round Up - ${catchyTitle} - Knitting Podcast ${emoji}`.trim();
}

export function buildFallbackPatternRoundUpDescription(
  patterns: PatternRoundUpSummary[]
): DescriptionResult {
  if (patterns.length === 0) {
    return {
      title: buildPatternRoundUpTitle('Patterns from my bundle', '✨'),
      description: 'In this episode I share a round up of patterns from my Ravelry bundle! ✨',
      ravelryLinks: '',
      hashtags: '#knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #patternroundup',
    };
  }
  const first = patterns[0];
  const oneTitle = first.patternName;
  const catchyTitle =
    patterns.length === 1
      ? oneTitle
      : `${patterns.map((p) => p.patternName).slice(0, 2).join(', ')}${patterns.length > 2 ? '…' : ''}`;
  const title = buildPatternRoundUpTitle(catchyTitle, '✨');
  const description =
    patterns.length === 1
      ? `In this episode I'm sharing a pattern I love: ${oneTitle}. 🎙️`
      : `In this episode I'm sharing ${patterns.length} patterns from my Ravelry bundle! ✨`;

  const ravelryLinks = patterns
    .filter((p) => p.patternUrl)
    .map((p) => {
      const label = [p.patternName, p.designerName].filter(Boolean).join(' by ');
      return `- ${label}: ${p.patternUrl}`;
    })
    .join('\n');

  const hashtags =
    '#knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #patternroundup #yarntogether';

  return { title, description, ravelryLinks, hashtags };
}

const SYSTEM_PROMPT = `You are a helpful assistant for knitting and fiber-arts podcasters. Generate a YouTube video (or knitting podcast episode) description based on the given Ravelry finished objects.

The video title will be assembled as: Ep. [##] | X FOs - {catchyTitle} - Knitting Podcast {emoji}
- X is the number of finished objects (provided in the user message). You only supply catchyTitle and emoji.
- "catchyTitle": A short, catchy phrase for the middle of the title. Reference the projects/patterns when it fits. Curiosity-sparking, clear keywords (knit, crochet, pattern themes). Max ~60 characters. No keyword stuffing.
- "titleEmoji": 1–2 tasteful cozy emojis (e.g. 🧶 ✨ 🎙️) for the end of the title.

Output a JSON object with exactly these keys (all strings):
- "catchyTitle": The catchy middle phrase for the title (see above).
- "titleEmoji": 1–2 cozy emojis for the title.
- "description": A short paragraph (2-4 sentences) that hooks the viewer and summarizes the episode. Use 1–2 emojis for warmth. Friendly, inclusive, cozy tone. Mention that these are finished objects / FOs. This will appear before "Show more" on YouTube.
- "ravelryLinks": A newline-separated list of lines. Each line: "- Pattern/Project name by Designer: https://www.ravelry.com/..." Use the exact URLs provided. Do not invent links.
- "hashtags": Space-separated relevant hashtags, e.g. #knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #FO plus any project-specific tags. No newlines.

Be concise. No keyword stuffing. Output only valid JSON, no markdown or extra text.`;

/** Use client-provided foCount if valid (finished-objects-only count), else cards.length. */
function resolveFoCount(cards: CardSummary[], foCount?: number): number {
  if (
    typeof foCount === 'number' &&
    Number.isInteger(foCount) &&
    foCount >= 0 &&
    foCount <= cards.length
  ) {
    return foCount;
  }
  return cards.length;
}

function buildUserMessage(
  cards: CardSummary[],
  optionalPrompt?: string,
  foCount?: number
): string {
  const count = resolveFoCount(cards, foCount);
  const projectList = cards
    .map((c) => {
      const parts = [
        `Project: ${c.projectName}`,
        c.patternName && `Pattern: ${c.patternName}`,
        c.designerName && `Designer: ${c.designerName}`,
        c.projectUrl && `URL: ${c.projectUrl}`,
      ].filter(Boolean);
      return parts.join('\n');
    })
    .join('\n\n');

  const foLine = `Number of finished objects (FOs) for the title: ${count}`;
  if (optionalPrompt?.trim()) {
    return `${foLine}\n\nOptional context from the creator: ${optionalPrompt.trim()}\n\nProjects:\n${projectList}`;
  }
  return `${foLine}\n\nProjects:\n${projectList}`;
}

function parseGroqResponse(content: string, foCount: number): DescriptionResult | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const catchyTitle = typeof obj.catchyTitle === 'string' ? obj.catchyTitle.trim() : '';
    const titleEmoji = typeof obj.titleEmoji === 'string' ? obj.titleEmoji.trim() : '✨';
    const description = typeof obj.description === 'string' ? obj.description : '';
    const ravelryLinks = typeof obj.ravelryLinks === 'string' ? obj.ravelryLinks : '';
    const hashtags = typeof obj.hashtags === 'string' ? obj.hashtags : '';
    if (!catchyTitle && !description) return null;
    const title = buildTitle(foCount, catchyTitle || 'My fiber arts FOs', titleEmoji);
    return { title, description, ravelryLinks, hashtags };
  } catch {
    return null;
  }
}

/**
 * Call Groq to generate title, description, Ravelry links section, and hashtags.
 * Returns null if API key missing, request fails, or response is not valid.
 * @param foCount - Number of selected projects that are finished objects (completed in range). If omitted, uses cards.length.
 */
export async function callGroqForDescription(
  apiKey: string,
  cards: CardSummary[],
  optionalPrompt?: string,
  foCount?: number
): Promise<DescriptionResult | null> {
  const count = resolveFoCount(cards, foCount);
  const client = new Groq({ apiKey });
  const userMessage = buildUserMessage(cards, optionalPrompt, foCount);

  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseGroqResponse(content, count);
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT_PATTERN_ROUND_UP = `You are a helpful assistant for knitting and fiber-arts podcasters. Generate a YouTube video (or knitting podcast episode) description for a "Pattern Round Up" episode based on the given Ravelry patterns (from the creator's bundle/favorites).

The video title will be assembled as: Ep. [##] | Pattern Round Up - {catchyTitle} 
- You only supply catchyTitle and emoji.
- "catchyTitle": A short, catchy phrase. Reference the patterns when it fits. Curiosity-sparking, clear keywords. Max ~60 characters. No keyword stuffing.
- "titleEmoji": 1–2 tasteful cozy emojis (e.g. 🧶 ✨ 🎙️).

Output a JSON object with exactly these keys (all strings):
- "catchyTitle": The catchy middle phrase for the title.
- "titleEmoji": 1–2 cozy emojis for the title.
- "description": A short paragraph (2-4 sentences) that hooks the viewer. This is a pattern round up (sharing patterns from a bundle), not finished objects. Use 1–2 emojis. Friendly, cozy tone. This will appear before "Show more" on YouTube.
- "ravelryLinks": A newline-separated list of lines. Each line: "- Pattern name by Designer: https://www.ravelry.com/..." Use the exact URLs provided. Do not invent links.
- "hashtags": Space-separated relevant hashtags, e.g. #knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #patternroundup plus any pattern-specific tags. No newlines.

Be concise. No keyword stuffing. Output only valid JSON, no markdown or extra text.`;

function buildPatternRoundUpUserMessage(
  patterns: PatternRoundUpSummary[],
  optionalPrompt?: string
): string {
  const patternList = patterns
    .map((p) => {
      const parts = [
        `Pattern: ${p.patternName}`,
        p.designerName && `Designer: ${p.designerName}`,
        p.patternUrl && `URL: ${p.patternUrl}`,
      ].filter(Boolean);
      return parts.join('\n');
    })
    .join('\n\n');
  if (optionalPrompt?.trim()) {
    return `Optional context from the creator: ${optionalPrompt.trim()}\n\nPatterns:\n${patternList}`;
  }
  return `Patterns:\n${patternList}`;
}

function parseGroqResponsePatternRoundUp(content: string): DescriptionResult | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const catchyTitle = typeof obj.catchyTitle === 'string' ? obj.catchyTitle.trim() : '';
    const titleEmoji = typeof obj.titleEmoji === 'string' ? obj.titleEmoji.trim() : '✨';
    const description = typeof obj.description === 'string' ? obj.description : '';
    const ravelryLinks = typeof obj.ravelryLinks === 'string' ? obj.ravelryLinks : '';
    const hashtags = typeof obj.hashtags === 'string' ? obj.hashtags : '';
    if (!catchyTitle && !description) return null;
    const title = buildPatternRoundUpTitle(catchyTitle || 'Patterns from my bundle', titleEmoji);
    return { title, description, ravelryLinks, hashtags };
  } catch {
    return null;
  }
}

export async function callGroqForPatternRoundUpDescription(
  apiKey: string,
  patterns: PatternRoundUpSummary[],
  optionalPrompt?: string
): Promise<DescriptionResult | null> {
  const client = new Groq({ apiKey });
  const userMessage = buildPatternRoundUpUserMessage(patterns, optionalPrompt);
  try {
    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_PATTERN_ROUND_UP },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content) return null;
    return parseGroqResponsePatternRoundUp(content);
  } catch {
    return null;
  }
}
