/**
 * Project board design definitions derived from project-board-prompts.
 * Each design defines a visual style for the Podcaster's Assistant project board.
 */
export interface ProjectBoardDesign {
  id: string;
  name: string;
  vibe: string;
  colors: string;
  layout: string;
  /** CSS custom properties and key styles to apply to the board card */
  style: Record<string, string>;
  promptHint: string;
  /** When true, card uses Canva PNG background layout (inner backdrop, field styling). */
  canvaLayout?: boolean;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Name and vibe for each Canva PNG design (canva-2 … canva-10); name is derived from the vibe. */
const CANVA_DESIGN_META: Record<
  number,
  { name: string; vibe: string }
> = {
  2: { name: 'Soft Minimal', vibe: 'Soft and minimal — plenty of white space, gentle typography' },
  3: { name: 'Warm & Crafty', vibe: 'Warm and crafty — cozy textures, earth tones' },
  4: { name: 'Bold Graphic', vibe: 'Bold and graphic — strong shapes, high contrast' },
  5: { name: 'Elegant Editorial', vibe: 'Elegant and editorial — refined layout, subtle accents' },
  6: { name: 'Playful & Colorful', vibe: 'Playful and colorful — bright palette, friendly feel' },
  7: { name: 'Natural Organic', vibe: 'Natural and organic — botanical touches, muted greens' },
  8: { name: 'Modern Sleek', vibe: 'Modern and sleek — clean lines, cool neutrals' },
  9: { name: 'Vintage Nostalgic', vibe: 'Vintage and nostalgic — retro type, muted palette' },
  10: { name: 'Structured Professional', vibe: 'Structured and professional — grid-led, business-like' },
};

/** Generates Canva PNG-based design entries for canva-{from} through canva-{to} (e.g. canva-2.png … canva-10.png). */
function canvaPngDesigns(from: number, to: number): ProjectBoardDesign[] {
  const designs: ProjectBoardDesign[] = [];
  for (let i = from; i <= to; i++) {
    const id = `canva-${i}`;
    const meta = CANVA_DESIGN_META[i];
    designs.push({
      id,
      name: meta?.name ?? `Canva ${i}`,
      vibe: meta?.vibe ?? 'Your Canva image as background',
      colors: 'Your Canva reference image as background',
      layout: 'Same structure (brand, photo, pattern, designer, fields); your design frames the content',
      style: {
        fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
        background: 'transparent',
        backgroundImage: `url(/${id}.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#1C1917',
        letterSpacing: '0.02em',
      },
      promptHint: `Board style using Canva design ${id}.png as background`,
      canvaLayout: true,
    });
  }
  return designs;
}

export const PROJECT_BOARD_DESIGNS: ProjectBoardDesign[] = [
  {
    id: slug('Scandinavian Calm'),
    name: 'Scandinavian Calm',
    vibe: 'Quiet, cozy, modern craft',
    colors: 'Warm white #F6F4F1, oat beige #D8CFC4, sage #9BAE9E, charcoal #2E2E2E',
    layout: 'Lots of breathing room, centered content, soft shadows',
    style: {
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: '#F6F4F1',
      color: '#2E2E2E',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      letterSpacing: '0.02em',
    },
    promptHint: 'Minimal Scandinavian knitting mood board, soft daylight, linen textures, calm neutral tones',
  },
  {
    id: slug('Technical Pattern Sheet'),
    name: 'Technical Pattern Sheet',
    vibe: 'Clear, modern, almost architectural',
    colors: 'White #FFFFFF, graphite #2D2D2D, blueprint blue #3A6EA5',
    layout: 'Grid-heavy, icons, precise alignment',
    style: {
      fontFamily: "'IBM Plex Sans', sans-serif",
      background: '#FFFFFF',
      color: '#2D2D2D',
      borderLeft: '6px solid #3A6EA5',
    },
    promptHint: 'Clean technical knitting pattern board, schematic diagrams, precision layout',
  },
  {
    id: slug('Neon Yarn Party'),
    name: 'Neon Yarn Party',
    vibe: '80s arcade meets yarn stash — loud and proud',
    colors: 'Hot pink #FF2D92, electric blue #00D4FF, lime #B8FF3C, purple #9D4EDD',
    layout: 'Gradient blocks, glow effects, stacked bold type',
    style: {
      fontFamily: "'Bebas Neue', 'Impact', sans-serif",
      background: 'linear-gradient(135deg, #1A0A2E 0%, #2D1B4E 50%, #0D0221 100%)',
      color: '#FF2D92',
      boxShadow: '0 0 30px rgba(255, 45, 146, 0.3), inset 0 0 60px rgba(0, 212, 255, 0.1)',
      letterSpacing: '0.12em',
      textShadow: '0 0 20px rgba(255, 45, 146, 0.8)',
    },
    promptHint: 'Retro 80s knitting mood board, neon signs, synthwave vibes, bold gradients',
  },
  {
    id: 'canva-style',
    name: 'Lavender & Lime',
    vibe: 'Clean layout with lavender and lime accents',
    colors: 'Your Canva reference image as background; lavender & lime accents',
    layout: 'Same structure (brand, photo, pattern, designer, fields); your design frames the content',
    style: {
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      background: 'transparent',
      backgroundImage: 'url(/canva-reference-board.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: '#1C1917',
      letterSpacing: '0.02em',
    },
    promptHint: 'Board style using your Canva reference image as background',
    canvaLayout: true,
  },
  ...canvaPngDesigns(2, 10),
];

/** Id for the Canva-style board design. */
export const CANVA_REFERENCE_DESIGN_ID = 'canva-style';

export const DEFAULT_BOARD_DESIGN_ID = PROJECT_BOARD_DESIGNS[0].id;

export function getProjectBoardDesignById(id: string): ProjectBoardDesign | undefined {
  return PROJECT_BOARD_DESIGNS.find((d) => d.id === id);
}
