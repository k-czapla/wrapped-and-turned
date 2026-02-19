import axios from 'axios';

export type ThumbnailMood = 'cozy' | 'bold' | 'minimal';

const MOOD_PROMPT_MAP: Record<ThumbnailMood, string> = {
  cozy: 'Cozy and warm aesthetic: soft lighting, warm colors, inviting and gentle. Perfect for a relaxed knitting podcast.',
  bold: 'Bold and playful: vibrant colors, dynamic composition, eye-catching and fun. Great for standing out in recommendations.',
  minimal: 'Minimal and clean: simple layout, plenty of white space, elegant typography. Professional and modern.',
};

/** Build the image prompt from project context, mood, and optional user prompt. */
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

const POLLINATIONS_IMAGE_BASE = 'https://image.pollinations.ai/prompt';

/**
 * Generate a thumbnail image using Pollinations AI (free, no API key).
 * Returns image buffer and content-type or null on failure.
 */
export async function generateThumbnail(
  projectNames: string[],
  mood: ThumbnailMood,
  userPrompt?: string
): Promise<{ imageBase64: string; contentType: string } | null> {
  const prompt = buildThumbnailPrompt(projectNames, mood, userPrompt);
  // Keep URL under common limits; Pollinations accepts the prompt in the path
  const encoded = encodeURIComponent(prompt.slice(0, 2000));
  const width = 1792;
  const height = 1024;
  const url = `${POLLINATIONS_IMAGE_BASE}/${encoded}?width=${width}&height=${height}&nologo=true`;

  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 120_000,
      maxContentLength: 10 * 1024 * 1024,
    });
    const data = response.data as ArrayBuffer;
    if (!data || data.byteLength === 0) return null;
    const contentType = (response.headers['content-type'] as string) || 'image/png';
    const base64 = Buffer.from(data).toString('base64');
    return { imageBase64: base64, contentType };
  } catch {
    return null;
  }
}
