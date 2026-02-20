import { NgStyle } from '@angular/common';
import { Component, input, computed } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import { DEFAULT_BOARD_DISPLAY_OPTIONS, type BoardDisplayOptions, type ProjectCard } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';

const DEFAULT_CARD_STYLE: Record<string, string> = {
  fontFamily: "system-ui, sans-serif",
  background: "linear-gradient(to bottom right, rgba(99,102,241,0.2), white, rgba(244,63,94,0.2))",
  color: "#0f172a",
};

@Component({
  selector: 'app-assistant-board-card',
  standalone: true,
  imports: [NgStyle, QRCodeComponent],
  templateUrl: './assistant-board-card.html',
  styleUrl: './assistant-board-card.css',
})
export class AssistantBoardCard {
  card = input<ProjectCard | null>(null);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<BoardDisplayOptions | null>(null);
  /** Selected photo index within project or pattern photos (from gallery). */
  selectedPhotoIndex = input<number>(0);

  protected isCanvaStyle = computed(() => this.design()?.canvaLayout === true);
  protected opts = computed(() => ({ ...DEFAULT_BOARD_DISPLAY_OPTIONS, ...this.displayOptions() }));

  /** Ravelry project page URL for the QR code; only set when card has projectUrl */
  protected projectUrl = computed(() => this.card()?.projectUrl ?? null);

  /** One-line date text for bottom of card: only shown when start date is available and dates are enabled. */
  protected dateLine = computed(() => {
    const c = this.card();
    const opts = this.opts();
    if (!c || (!opts.showStartDate && !opts.showCompletedDate)) return null;
    const start = this.parseAndFormatDate(c.started);
    if (!start) return null;
    const end = this.parseAndFormatDate(c.completed);
    if (end) return `${start} – ${end}`;
    return `${start} – In progress`;
  });

  private parseAndFormatDate(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /** Image URL to display: from project/pattern photos by selected index, or fallback to card.imageUrl. */
  protected displayImageUrl = computed(() => {
    const c = this.card();
    const opts = this.opts();
    if (!c || !opts.showPhoto) return null;
    const idx = this.selectedPhotoIndex();
    const source = opts.photoSource ?? 'project';
    const list =
      source === 'pattern'
        ? (c.patternPhotos ?? [])
        : (c.projectPhotos ?? (c.imageUrl ? [c.imageUrl] : []));
    const url = list[idx] ?? list[0];
    return url ?? c.imageUrl ?? null;
  });

  protected cardStyle = computed(() => {
    const d = this.design();
    if (!d?.style) return DEFAULT_CARD_STYLE;
    return { ...DEFAULT_CARD_STYLE, ...d.style };
  });
}
