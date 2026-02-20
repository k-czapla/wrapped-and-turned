import { Component, inject, computed } from '@angular/core';
import { BoardDesignService, BOARD_DESIGN_FONTS } from '../../services/board-design.service';
import { AssistantBoardCard } from '../assistant-board-card/assistant-board-card';
import { BoardBackgroundUpload } from '../board-background-upload/board-background-upload';
import type { ProjectCard } from '../../services/api';

const SAMPLE_PROJECT_CARD: ProjectCard = {
  id: 0,
  projectName: 'Cozy Cable Sweater',
  patternName: 'Cozy Cable Sweater',
  designerName: 'Jane Designer',
  sizeMade: 'M (38" chest)',
  yarnUsed: 'Malabrigo Ríos, 3 skeins',
  needleSizes: '4mm + 3.5mm',
  projectUrl: 'https://www.ravelry.com/projects/demo/example-project',
};

/** Parse rgba(r,g,b,a) or rgb(r,g,b) to hex and alpha (0–100). */
function rgbaToHexAndAlpha(value: string): { hex: string; alpha: number } {
  const match = value.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (!match) return { hex: '#2e2e2e', alpha: 100 };
  const r = Math.max(0, Math.min(255, parseInt(match[1], 10)));
  const g = Math.max(0, Math.min(255, parseInt(match[2], 10)));
  const b = Math.max(0, Math.min(255, parseInt(match[3], 10)));
  const a = match[4] != null ? Math.max(0, Math.min(1, parseFloat(match[4]))) : 1;
  const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return { hex, alpha: Math.round(a * 100) };
}

/** Build rgba(r,g,b,a) from hex and alpha 0–100. */
function hexAndAlphaToRgba(hex: string, alpha: number): string {
  const a = Math.max(0, Math.min(100, alpha)) / 100;
  let r = 0,
    g = 0,
    b = 0;
  const m = hex.replace(/^#/, '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (m) {
    r = parseInt(m[1], 16);
    g = parseInt(m[2], 16);
    b = parseInt(m[3], 16);
  }
  return `rgba(${r},${g},${b},${a})`;
}

@Component({
  selector: 'app-board-design-customizer',
  standalone: true,
  imports: [AssistantBoardCard, BoardBackgroundUpload],
  templateUrl: './board-design-customizer.html',
  styleUrl: './board-design-customizer.css',
})
export class BoardDesignCustomizer {
  private boardDesign = inject(BoardDesignService);

  protected fonts = BOARD_DESIGN_FONTS;
  protected effectiveDesign = this.boardDesign.effectiveDesign;
  protected userCustomization = this.boardDesign.userCustomization;

  protected sampleCard = SAMPLE_PROJECT_CARD;

  protected backgroundColorHex = computed(() => {
    const bg = this.userCustomization().backgroundColor;
    return bg ? rgbaToHexAndAlpha(bg).hex : '';
  });
  protected backgroundColorAlpha = computed(() => {
    const bg = this.userCustomization().backgroundColor;
    return bg ? rgbaToHexAndAlpha(bg).alpha : 100;
  });
  protected textColorHex = computed(() => {
    const tc = this.userCustomization().textColor;
    return tc ? rgbaToHexAndAlpha(tc).hex : '';
  });
  protected textColorAlpha = computed(() => {
    const tc = this.userCustomization().textColor;
    return tc ? rgbaToHexAndAlpha(tc).alpha : 100;
  });
  protected borderColorHex = computed(() => {
    const bc = this.userCustomization().borderColor;
    return bc ? rgbaToHexAndAlpha(bc).hex : '';
  });
  protected borderColorAlpha = computed(() => {
    const bc = this.userCustomization().borderColor;
    return bc ? rgbaToHexAndAlpha(bc).alpha : 100;
  });

  setFont(fontId: string) {
    this.boardDesign.setUserCustomization({ fontId: fontId || undefined });
  }

  setBackgroundColor(hex: string, alpha: number) {
    this.boardDesign.setUserCustomization({
      backgroundColor: hex ? hexAndAlphaToRgba(hex, alpha) : undefined,
    });
  }

  setBackgroundImage(dataUrl: string | undefined) {
    this.boardDesign.setUserCustomization({
      backgroundImageDataUrl: dataUrl,
    });
  }

  setTextColor(hex: string, alpha: number) {
    this.boardDesign.setUserCustomization({
      textColor: hex ? hexAndAlphaToRgba(hex, alpha) : undefined,
    });
  }

  setBorderWidth(width: number | undefined) {
    this.boardDesign.setUserCustomization({ borderWidth: width });
  }

  setBorderStyle(style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none' | undefined) {
    this.boardDesign.setUserCustomization({ borderStyle: style });
  }

  setBorderColor(hex: string, alpha: number) {
    this.boardDesign.setUserCustomization({
      borderColor: hex ? hexAndAlphaToRgba(hex, alpha) : undefined,
    });
  }

  onBackgroundColorChange(hex: string, alpha: number) {
    this.setBackgroundColor(hex, alpha);
  }
  onTextColorChange(hex: string, alpha: number) {
    this.setTextColor(hex, alpha);
  }
  onBorderColorChange(hex: string, alpha: number) {
    this.setBorderColor(hex, alpha);
  }
}
