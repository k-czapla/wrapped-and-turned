import { Injectable, signal, computed } from '@angular/core';
import {
  PROJECT_BOARD_DESIGNS,
  DEFAULT_BOARD_DESIGN_ID,
  getProjectBoardDesignById,
  type ProjectBoardDesign,
} from './project-board-designs';

const STORAGE_KEY = 'wrapped-and-turned-board-design';
const CUSTOMIZATION_STORAGE_KEY = 'wrapped-and-turned-board-design-customization';

/** User overrides for the selected board design (font, colors, card shape, border). */
export interface BoardDesignCustomization {
  fontId?: string;
  backgroundColor?: string;
  textColor?: string;
  cardShape?: 'rounded' | 'square';
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderColor?: string;
}

/** Ten font options for board card customization. */
export const BOARD_DESIGN_FONTS: { id: string; label: string; fontFamily: string }[] = [
  { id: 'inter', label: 'Inter', fontFamily: "'Inter', 'Helvetica Neue', sans-serif" },
  { id: 'playfair', label: 'Playfair Display', fontFamily: "'Playfair Display', serif" },
  { id: 'libre-baskerville', label: 'Libre Baskerville', fontFamily: "'Libre Baskerville', serif" },
  { id: 'poppins', label: 'Poppins', fontFamily: "'Poppins', sans-serif" },
  { id: 'noto-sans-jp', label: 'Noto Sans JP', fontFamily: "'Noto Sans JP', sans-serif" },
  { id: 'merriweather', label: 'Merriweather', fontFamily: "'Merriweather', serif" },
  { id: 'ibm-plex-sans', label: 'IBM Plex Sans', fontFamily: "'IBM Plex Sans', sans-serif" },
  { id: 'cormorant-garamond', label: 'Cormorant Garamond', fontFamily: "'Cormorant Garamond', serif" },
  { id: 'bebas-neue', label: 'Bebas Neue', fontFamily: "'Bebas Neue', 'Impact', sans-serif" },
  { id: 'fredoka', label: 'Fredoka', fontFamily: "'Fredoka', 'Nunito', sans-serif" },
];

const DEFAULT_BORDER_RADIUS = '16px';

@Injectable({ providedIn: 'root' })
export class BoardDesignService {
  private selectedId = signal<string | null>(this.readStoredId());
  private customization = signal<BoardDesignCustomization>(this.readStoredCustomization());

  readonly designs = PROJECT_BOARD_DESIGNS;
  readonly fonts = BOARD_DESIGN_FONTS;

  readonly selectedDesignId = computed(() => this.selectedId() ?? DEFAULT_BOARD_DESIGN_ID);

  readonly selectedDesign = computed<ProjectBoardDesign>(() => {
    const id = this.selectedDesignId();
    return getProjectBoardDesignById(id) ?? PROJECT_BOARD_DESIGNS[0];
  });

  readonly userCustomization = this.customization.asReadonly();

  /** Selected design with user customization (font, colors, shape, border) applied to style. */
  readonly effectiveDesign = computed<ProjectBoardDesign>(() => {
    const design = this.selectedDesign();
    const custom = this.customization();
    const baseStyle = { ...design.style };

    if (custom.fontId) {
      const font = BOARD_DESIGN_FONTS.find((f) => f.id === custom.fontId);
      if (font) baseStyle['fontFamily'] = font.fontFamily;
    }
    if (custom.backgroundColor != null) baseStyle['background'] = custom.backgroundColor;
    if (custom.textColor != null) baseStyle['color'] = custom.textColor;
    if (custom.cardShape === 'square') baseStyle['borderRadius'] = '0';
    else if (custom.cardShape === 'rounded') baseStyle['borderRadius'] = design.style?.['borderRadius'] ?? DEFAULT_BORDER_RADIUS;

    // Apply border customization
    if (custom.borderWidth != null || custom.borderStyle != null || custom.borderColor != null) {
      // Remove individual border properties if they exist in the design
      delete baseStyle['borderLeft'];
      delete baseStyle['borderRight'];
      delete baseStyle['borderTop'];
      delete baseStyle['borderBottom'];
      delete baseStyle['borderWidth'];
      delete baseStyle['borderStyle'];
      delete baseStyle['borderColor'];
      
      // Handle border style 'none' or width 0 - remove border completely
      if (custom.borderStyle === 'none' || (custom.borderWidth != null && custom.borderWidth === 0)) {
        baseStyle['border'] = 'none';
      } else {
        // Construct complete border value from user customization
        // Use user values or sensible defaults
        const width = custom.borderWidth != null ? `${custom.borderWidth}px` : '1px';
        const style = custom.borderStyle ?? 'solid';
        const color = custom.borderColor ?? (baseStyle['color'] || '#2e2e2e');
        
        // Use shorthand border property to override any existing border styles
        baseStyle['border'] = `${width} ${style} ${color}`;
      }
    }

    return { ...design, style: baseStyle };
  });

  setSelectedDesignId(id: string) {
    const design = getProjectBoardDesignById(id);
    if (design) {
      this.selectedId.set(id);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore storage errors
      }
    }
  }

  setUserCustomization(partial: Partial<BoardDesignCustomization>) {
    this.customization.update((prev) => {
      const next = { ...prev, ...partial };
      try {
        localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }

  private readStoredId(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && getProjectBoardDesignById(stored)) return stored;
    } catch {
      // ignore
    }
    return null;
  }

  private readStoredCustomization(): BoardDesignCustomization {
    try {
      const raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (parsed == null || typeof parsed !== 'object') return {};
      const o = parsed as Record<string, unknown>;
      const out: BoardDesignCustomization = {};
      if (typeof o['fontId'] === 'string') out.fontId = o['fontId'];
      if (typeof o['backgroundColor'] === 'string') out.backgroundColor = o['backgroundColor'];
      if (typeof o['textColor'] === 'string') out.textColor = o['textColor'];
      if (o['cardShape'] === 'rounded' || o['cardShape'] === 'square') out.cardShape = o['cardShape'];
      if (typeof o['borderWidth'] === 'number') out.borderWidth = o['borderWidth'];
      if (o['borderStyle'] === 'solid' || o['borderStyle'] === 'dashed' || o['borderStyle'] === 'dotted' || o['borderStyle'] === 'double' || o['borderStyle'] === 'none') {
        out.borderStyle = o['borderStyle'];
      }
      if (typeof o['borderColor'] === 'string') out.borderColor = o['borderColor'];
      return out;
    } catch {
      return {};
    }
  }
}
