import Groq from 'groq-sdk';

export type CardSummary = {
  projectName: string;
  patternName?: string;
  designerName?: string;
  projectUrl?: string;
};

export type DescriptionResult = {
  title: string;
  description: string;
  ravelryLinks: string;
  hashtags: string;
};

/** Build non-AI fallback when Groq is unavailable or fails. */
export function buildFallbackDescription(cards: CardSummary[]): DescriptionResult {
  if (cards.length === 0) {
    return {
      title: '🧶 My fiber arts FOs',
      description: 'In this episode I share these finished objects! ✨',
      ravelryLinks: '',
      hashtags: '#knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast',
    };
  }

  const first = cards[0];
  const oneTitle = first.patternName || first.projectName;
  const title =
    cards.length === 1
      ? `🧶 ${oneTitle} ✨`
      : `🧶 ${cards.length} FOs: ${cards.map((c) => c.patternName || c.projectName).slice(0, 2).join(', ')}${cards.length > 2 ? '…' : ''}`;
  const description =
    cards.length === 1
      ? `In this episode I'm sharing my finished object: ${oneTitle}. 🎙️`
      : `In this episode I'm sharing ${cards.length} finished objects from my Ravelry! ✨`;

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

const SYSTEM_PROMPT = `You are a helpful assistant for knitting and fiber-arts podcasters. Generate a YouTube video (or knitting podcast episode) description based on the given Ravelry finished objects.

"Knitting podcast" algorithm tips: Use a catchy, click-worthy title that sparks curiosity and includes clear keywords (e.g. finished objects, FO, knit, crochet, pattern names). The first line of the description should hook listeners and work well for discovery. Keep it conversational and cozy—like a friend sharing their makes.

Output a JSON object with exactly these keys (all strings):
- "title": A catchy, curiosity-sparking title (suitable for YouTube and podcast apps). Include 1–2 tasteful emojis (e.g. 🧶 ✨ 🎙️). Max ~60 characters. Make it fun and shareable.
- "description": A short paragraph (2-4 sentences) that hooks the viewer and summarizes the episode. Use 1–2 emojis for warmth. Friendly, inclusive, cozy tone. Mention that these are finished objects / FOs. This will appear before "Show more" on YouTube.
- "ravelryLinks": A newline-separated list of lines. Each line: "- Pattern/Project name by Designer: https://www.ravelry.com/..." Use the exact URLs provided. Do not invent links.
- "hashtags": Space-separated relevant hashtags, e.g. #knitting #crochet #handmade #ravelry #fiberarts #knittingpodcast #FO plus any project-specific tags. No newlines.

Be concise. No keyword stuffing. Output only valid JSON, no markdown or extra text.`;

function buildUserMessage(cards: CardSummary[], optionalPrompt?: string): string {
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

  if (optionalPrompt?.trim()) {
    return `Optional context from the creator: ${optionalPrompt.trim()}\n\nProjects:\n${projectList}`;
  }
  return `Projects:\n${projectList}`;
}

function parseGroqResponse(content: string): DescriptionResult | null {
  const trimmed = content.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const obj = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const title = typeof obj.title === 'string' ? obj.title : '';
    const description = typeof obj.description === 'string' ? obj.description : '';
    const ravelryLinks = typeof obj.ravelryLinks === 'string' ? obj.ravelryLinks : '';
    const hashtags = typeof obj.hashtags === 'string' ? obj.hashtags : '';
    if (!title && !description) return null;
    return { title: title || '🧶 My fiber arts FOs', description, ravelryLinks, hashtags };
  } catch {
    return null;
  }
}

/**
 * Call Groq to generate title, description, Ravelry links section, and hashtags.
 * Returns null if API key missing, request fails, or response is not valid.
 */
export async function callGroqForDescription(
  apiKey: string,
  cards: CardSummary[],
  optionalPrompt?: string
): Promise<DescriptionResult | null> {
  const client = new Groq({ apiKey });
  const userMessage = buildUserMessage(cards, optionalPrompt);

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
    return parseGroqResponse(content);
  } catch {
    return null;
  }
}
