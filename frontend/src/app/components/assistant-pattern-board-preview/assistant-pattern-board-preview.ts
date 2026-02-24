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
import type { PatternRoundUpCard, PatternRoundUpDisplayOptions } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';
import { Api } from '../../services/api';
import { AssistantPatternBoardCard } from '../assistant-pattern-board-card/assistant-pattern-board-card';

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
  cards = input<PatternRoundUpCard[]>([]);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<PatternRoundUpDisplayOptions | null>(null);
  selectedPhotoIndexByPatternId = input<Record<number, number>>({});

  selectedPhotoIndexChange = output<{ patternId: number; index: number }>();

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
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const card = this.cards()[index];
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
}
