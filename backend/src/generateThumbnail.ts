import OpenAI from 'openai';

export type ThumbnailMood = 'cozy' | 'bold' | 'minimal';

const MOOD_PROMPT_MAP: Record<ThumbnailMood, string> = {
  cozy: 'Cozy and warm aesthetic: soft lighting, warm colors, inviting and gentle. Perfect for a relaxed knitting podcast.',
  bold: 'Bold and playful: vibrant colors, dynamic composition, eye-catching and fun. Great for standing out in recommendations.',
  minimal: 'Minimal and clean: simple layout, plenty of white space, elegant typography. Professional and modern.',
};

/** Build the image prompt for DALL-E 3 from project context, mood, and optional user prompt. */
export function buildThumbnailPrompt(
  projectNames: string[],
  mood: ThumbnailMood,
  userPrompt?: string
): string {
  const moodDesc = MOOD_PROMPT_MAP[mood];
  const projectList =
    projectNames.length > 0
      ? `Featuring these fiber-arts projects: ${projectNames.slice(0, 10).join(', ')}${projectNames.length > 10 ? ' and more' : ''}.`
      : 'Fiber arts and knitting podcast theme.';
  const userPart = userPrompt?.trim() ? ` Creator's direction: ${userPrompt.trim()}.` : '';
  return `A fun, click-worthy YouTube thumbnail image for a knitting or fiber-arts podcast episode. ${moodDesc} ${projectList}${userPart} Style: suitable for YouTube thumbnail, 16:9 aspect ratio, no text in the image, high quality, appealing to craft and yarn enthusiasts.`;
}

/**
 * Generate a single thumbnail image using OpenAI DALL-E 3.
 * Returns base64 PNG data or null if API key missing or request fails.
 */
export async function generateThumbnailWithOpenAI(
  apiKey: string,
  projectNames: string[],
  mood: ThumbnailMood,
  userPrompt?: string
): Promise<{ imageBase64: string; contentType: string } | null> {
  const openai = new OpenAI({ apiKey });
  const prompt = buildThumbnailPrompt(projectNames, mood, userPrompt);

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1792x1024', // YouTube-thumbnail-friendly landscape
      quality: 'standard',
      style: 'vivid',
      response_format: 'b64_json',
    });

    const first = response.data?.[0];
    const b64 = first?.b64_json;
    if (!b64 || typeof b64 !== 'string') return null;

    return {
      imageBase64: b64,
      contentType: 'image/png',
    };
  } catch {
    return null;
  }
}
