import {
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  QueryList,
  signal,
  ViewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import type { PatternRoundUpCard, PatternRoundUpDisplayOptions } from '../../services/api';
import { compositeBoardWithQr } from '../../utils/board-download';
import type { ProjectBoardDesign } from '../../services/project-board-designs';
import { Api } from '../../services/api';
import {
  AssistantPatternBoardCard,
  PATTERN_BOARD_EDITABLE_FIELDS,
} from '../assistant-pattern-board-card/assistant-pattern-board-card';

@Component({
  selector: 'app-assistant-pattern-board-preview',
  standalone: true,
  imports: [AssistantPatternBoardCard, RouterLink],
  templateUrl: './assistant-pattern-board-preview.html',
  styleUrl: './assistant-pattern-board-preview.css',
})
export class AssistantPatternBoardPreview {
  private api = inject(Api);
  currentSlideIndex = signal(0);
  /** True while downloading all boards (disables Download all button). */
  downloadingAll = signal(false);
  cards = input<PatternRoundUpCard[]>([]);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<PatternRoundUpDisplayOptions | null>(null);
  selectedPhotoIndexByPatternId = input<Record<number, number>>({});
  photoPositionByPatternId = input<Record<number, { x: number; y: number }>>({});
  private fieldOverridesByCardId = signal<Record<number, Record<string, string>>>({});

  selectedPhotoIndexChange = output<{ patternId: number; index: number }>();
  photoPositionChange = output<{ patternId: number; position: { x: number; y: number } }>();
  photoPositionReset = output<{ patternId: number }>();

  @ViewChildren('board') private boardEls?: QueryList<ElementRef<HTMLElement>>;

  constructor() {
    effect(() => {
      const len = this.cards().length;
      const idx = this.currentSlideIndex();
      if (len > 0 && idx >= len) this.currentSlideIndex.set(Math.max(0, len - 1));
    });
  }

  protected selectedIndex(card: PatternRoundUpCard): number {
    const map = this.selectedPhotoIndexByPatternId();
    const idx = map[card.id];
    return typeof idx === 'number' ? idx : 0;
  }

  protected photoPosForCard(card: PatternRoundUpCard): { x: number; y: number } {
    return this.photoPositionByPatternId()[card.id] ?? { x: 50, y: 50 };
  }

  protected onFramingInput(card: PatternRoundUpCard, ev: Event, axis: 'x' | 'y') {
    const raw = Number((ev.target as HTMLInputElement).value);
    const v = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 50));
    const cur = this.photoPosForCard(card);
    const position = axis === 'x' ? { ...cur, x: v } : { ...cur, y: v };
    this.photoPositionChange.emit({ patternId: card.id, position });
  }

  protected fieldOverridesForCard(card: PatternRoundUpCard): Record<string, string> | null {
    const byId = this.fieldOverridesByCardId();
    const overrides = byId[card.id];
    return overrides && Object.keys(overrides).length > 0 ? overrides : null;
  }

  protected onFieldOverrideChange(
    card: PatternRoundUpCard,
    event: { field: string; value: string }
  ): void {
    if (
      !PATTERN_BOARD_EDITABLE_FIELDS.includes(event.field as (typeof PATTERN_BOARD_EDITABLE_FIELDS)[number])
    )
      return;
    this.fieldOverridesByCardId.update((byId) => {
      const next = { ...byId };
      const cardOverrides = { ...(next[card.id] ?? {}), [event.field]: event.value };
      if (event.value === '') delete cardOverrides[event.field];
      if (Object.keys(cardOverrides).length === 0) delete next[card.id];
      else next[card.id] = cardOverrides;
      return next;
    });
  }

  protected photosForCard(card: PatternRoundUpCard): string[] {
    const opts = this.displayOptions();
    if (!opts?.showPhoto) return [];
    return card.patternPhotos ?? (card.imageUrl ? [card.imageUrl] : []);
  }

  get canGoPrev(): boolean {
    return this.currentSlideIndex() > 0;
  }

  get canGoNext(): boolean {
    const idx = this.currentSlideIndex();
    const len = this.cards().length;
    return len > 0 && idx < len - 1;
  }

  goPrev(): void {
    if (this.canGoPrev) this.currentSlideIndex.update((i) => i - 1);
  }

  goNext(): void {
    if (this.canGoNext) this.currentSlideIndex.update((i) => i + 1);
  }

  goToSlide(index: number): void {
    const len = this.cards().length;
    if (index >= 0 && index < len) this.currentSlideIndex.set(index);
  }

  private downloadBaseName(card: PatternRoundUpCard | undefined, index: number): string {
    const raw =
      card?.patternName?.trim() ?? `pattern-${card?.id ?? index}`;
    const sanitized = raw
      .replace(/[/\\:*?"<>|]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return sanitized || `pattern-${card?.id ?? index}`;
  }

  async downloadBoard(index: number) {
    const el = this.boardEls?.get(index)?.nativeElement;
    if (!el) return;

    const images = el.querySelectorAll<HTMLImageElement>('img[src]');
    const originalSrcs: string[] = [];
    const dataUrlPromises: Promise<void>[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.src;
      if (src && (src.includes('ravelrycache.com') || src.includes('ravelry.com'))) {
        originalSrcs[i] = src;
        dataUrlPromises.push(
          this.api
            .proxyImageToDataUrl(src)
            .then((dataUrl) => {
              img.src = dataUrl;
            })
            .catch(() => {})
        );
      }
    }

    await Promise.all(dataUrlPromises);
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const boardDataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });

      const card = this.cards()[index];
      let dataUrl = boardDataUrl;
      const qrSizePx = 360; // 120 logical px at 3x
      if (card?.patternUrl && this.displayOptions()?.showQrCode) {
        try {
          const qrDataUrl = await QRCode.toDataURL(card.patternUrl, {
            width: qrSizePx,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
          });
          dataUrl = await compositeBoardWithQr(boardDataUrl, qrDataUrl, qrSizePx);
        } catch (e) {
          console.warn('QR generation failed, downloading board only:', e);
        }
      }

      const baseName = this.downloadBaseName(card, index);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `wrapped-and-turned-${baseName}.png`;
      a.click();
    } finally {
      for (let i = 0; i < images.length; i++) {
        if (originalSrcs[i]) {
          images[i].src = originalSrcs[i];
        }
      }
    }
  }

  /** Download all boards as individual PNG files (one per selected pattern). */
  async downloadAllBoards() {
    const len = this.cards().length;
    if (len === 0) return;
    this.downloadingAll.set(true);
    try {
      for (let i = 0; i < len; i++) {
        await this.downloadBoard(i);
        if (i < len - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
    } finally {
      this.downloadingAll.set(false);
    }
  }
}
