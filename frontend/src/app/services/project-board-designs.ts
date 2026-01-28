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
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
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
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      letterSpacing: '0.02em',
    },
    promptHint: 'Minimal Scandinavian knitting mood board, soft daylight, linen textures, calm neutral tones',
  },
  {
    id: slug('Vintage Pattern Book'),
    name: 'Vintage Pattern Book',
    vibe: '1950s knitting magazine, slightly nostalgic',
    colors: 'Cream #FAF3E6, dusty rose #C87C74, moss #6F7F5E, ink brown #3B2E2A',
    layout: 'Framed sections, serif titles, decorative dividers',
    style: {
      fontFamily: "'Playfair Display', serif",
      background: '#FAF3E6',
      color: '#3B2E2A',
      border: '2px solid #6F7F5E',
      textTransform: 'uppercase',
    },
    promptHint: 'Vintage crochet pattern board, aged paper, retro typography, soft grain',
  },
  {
    id: slug('Botanical Studio'),
    name: 'Botanical Studio',
    vibe: 'Yarn meets herbarium',
    colors: 'Fern #4F6F52, clay #C08A5A, parchment #EFE8D8, ink #2B2B2B',
    layout: 'Organic spacing, botanical overlays, yarn photographed with plants',
    style: {
      fontFamily: "'Libre Baskerville', serif",
      background: 'linear-gradient(#EFE8D8, #E5DCCB)',
      color: '#2B2B2B',
      borderRadius: '12px',
    },
    promptHint: 'Fiber art mood board with leaves, botanical illustration style, warm natural light',
  },
  {
    id: slug('Editorial Fashion Spread'),
    name: 'Editorial Fashion Spread',
    vibe: 'High-end knitwear magazine',
    colors: 'Black #0F0F0F, bone #EDEBE7, steel #9FA4A9',
    layout: 'Big photography, tiny captions, strong grid',
    style: {
      fontFamily: "'Didot', 'Bodoni MT', serif",
      background: '#0F0F0F',
      color: '#EDEBE7',
      letterSpacing: '0.08em',
      textAlign: 'left',
    },
    promptHint: 'Luxury knitting project board, editorial fashion layout, dramatic lighting',
  },
  {
    id: slug('Playful Modern Craft'),
    name: 'Playful Modern Craft',
    vibe: 'Fun, bold, indie yarn shop',
    colors: 'Coral #FF6F61, mustard #F2B705, sky #5DA9E9, off-white #FFF8EE',
    layout: 'Color blocks, stickers, irregular shapes',
    style: {
      fontFamily: "'Poppins', sans-serif",
      background: '#FFF8EE',
      color: '#333',
      borderRadius: '24px',
      boxShadow: '0 12px 0 #FF6F61',
    },
    promptHint: 'Playful crochet mood board, bold colors, modern craft aesthetic',
  },
  {
    id: slug('Japanese Minimal Craft'),
    name: 'Japanese Minimal Craft',
    vibe: 'Thoughtful, restrained, tactile',
    colors: 'Rice #F7F6F2, sumi ink #2A2A2A, muted indigo #3E4A59',
    layout: 'Vertical rhythm, asymmetry, negative space',
    style: {
      fontFamily: "'Noto Sans JP', sans-serif",
      background: '#F7F6F2',
      color: '#2A2A2A',
      lineHeight: '1.8',
    },
    promptHint: 'Japanese minimal knitting board, wabi-sabi textures, soft shadows',
  },
  {
    id: slug('Rustic Cabin Handmade'),
    name: 'Rustic Cabin Handmade',
    vibe: 'Fireside knitting, wool and wood',
    colors: 'Bark #5A3E2B, wool #D6C6B2, forest #3E5B4F',
    layout: 'Layered textures, kraft paper look',
    style: {
      fontFamily: "'Merriweather', serif",
      background: '#D6C6B2',
      color: '#3B2A20',
    },
    promptHint: 'Rustic knitting project board, cabin aesthetic, natural wool textures',
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
    id: slug('Soft Romantic Heirloom'),
    name: 'Soft Romantic Heirloom',
    vibe: 'Lace, heirlooms, slow craft',
    colors: 'Blush #EAD7D1, pearl #F8F6F4, lavender #B8A1C6',
    layout: 'Soft focus images, flowing typography',
    style: {
      fontFamily: "'Cormorant Garamond', serif",
      background: '#F8F6F4',
      color: '#5A4A4A',
      borderRadius: '20px',
    },
    promptHint: 'Romantic crochet project board, lace textures, dreamy lighting',
  },
  {
    id: slug('Experimental Art Fiber'),
    name: 'Experimental Art Fiber',
    vibe: 'Gallery wall, conceptual textile art',
    colors: 'Concrete #BEBEBE, rust #A23E2A, black #111111',
    layout: 'Overlapping elements, raw photography, bold type',
    style: {
      fontFamily: "'Neue Haas Grotesk', sans-serif",
      background: '#BEBEBE',
      color: '#111111',
    },
    promptHint: 'Experimental fiber art mood board, contemporary art exhibition style',
  },
];

export const DEFAULT_BOARD_DESIGN_ID = PROJECT_BOARD_DESIGNS[0].id;

export function getProjectBoardDesignById(id: string): ProjectBoardDesign | undefined {
  return PROJECT_BOARD_DESIGNS.find((d) => d.id === id);
}
