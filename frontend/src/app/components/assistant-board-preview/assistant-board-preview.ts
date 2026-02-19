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
import type { BoardDisplayOptions, ProjectCard } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';
import { Api } from '../../services/api';
import { AssistantBoardCard } from '../assistant-board-card/assistant-board-card';

@Component({
  selector: 'app-assistant-board-preview',
  imports: [AssistantBoardCard, RouterLink],
  templateUrl: './assistant-board-preview.html',
  styleUrl: './assistant-board-preview.css',
})
export class AssistantBoardPreview {
  private api = inject(Api);
  /** Current carousel slide index (0-based). */
  currentSlideIndex = signal(0);
  cards = input<ProjectCard[]>([]);
  cardsLoading = input<boolean>(false);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<BoardDisplayOptions | null>(null);
  /** Photo source (project vs pattern) per project board. */
  photoSourceByProjectId = input<Record<number, 'project' | 'pattern'>>({});
  /** Per-project selected photo index (for project/pattern photo gallery). */
  selectedPhotoIndexByProjectId = input<Record<number, number>>({});
  photoSourceChange = output<{ projectId: number; source: 'project' | 'pattern' }>();
  selectedPhotoIndexChange = output<{ projectId: number; index: number }>();
  /** Emitted when the user uploads a photo from their computer for a project board. */
  photoUpload = output<{ projectId: number; dataUrl: string }>();

  @ViewChildren('board') private boardEls?: QueryList<ElementRef<HTMLElement>>;

  constructor() {
    effect(() => {
      const len = this.cards().length;
      const idx = this.currentSlideIndex();
      if (len > 0 && idx >= len) this.currentSlideIndex.set(Math.max(0, len - 1));
    });
  }

  /** Photo source for a given card (per-board). */
  protected photoSourceForCard(card: ProjectCard): 'project' | 'pattern' {
    const byId = this.photoSourceByProjectId();
    const source = byId[card.id];
    if (source) return source;
    return this.displayOptions()?.photoSource ?? 'project';
  }

  /** Display options for a given card (global options with per-board photo source). */
  protected displayOptionsForCard(card: ProjectCard): BoardDisplayOptions | null {
    const opts = this.displayOptions();
    if (!opts) return null;
    return { ...opts, photoSource: this.photoSourceForCard(card) };
  }

  /** Photos to show in gallery for the current source (project or pattern). */
  protected photosForCard(card: ProjectCard): string[] {
    const opts = this.displayOptions();
    if (!opts?.showPhoto) return [];
    const source = this.photoSourceForCard(card);
    return source === 'pattern'
      ? (card.patternPhotos ?? [])
      : (card.projectPhotos ?? (card.imageUrl ? [card.imageUrl] : []));
  }

  protected selectedIndex(card: ProjectCard): number {
    const map = this.selectedPhotoIndexByProjectId();
    const idx = map[card.id];
    return typeof idx === 'number' ? idx : 0;
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

  protected onFileSelected(card: ProjectCard, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.photoUpload.emit({ projectId: card.id, dataUrl });
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  async downloadBoard(index: number) {
    const el = this.boardEls?.get(index)?.nativeElement;
    if (!el) return;

    // Convert external images to data URLs to avoid CORS issues
    const images = el.querySelectorAll<HTMLImageElement>('img[src]');
    const originalSrcs: string[] = [];
    const dataUrlPromises: Promise<void>[] = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const src = img.src;

      // Only proxy external images (Ravelry images)
      if (src && (src.includes('ravelrycache.com') || src.includes('ravelry.com'))) {
        originalSrcs[i] = src;
        dataUrlPromises.push(
          this.api
            .proxyImageToDataUrl(src)
            .then((dataUrl) => {
              img.src = dataUrl;
            })
            .catch((error) => {
              console.warn('Failed to proxy image, using original:', error);
              // Keep original src if proxy fails
            })
        );
      }
    }

    // Wait for all images to be converted to data URLs
    await Promise.all(dataUrlPromises);

    // Wait a bit for images to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      const card = this.cards()[index];
      const id = card?.id ?? index;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `wrapped-and-turned-project-${id}.png`;
      a.click();
    } finally {
      // Restore original image sources
      for (let i = 0; i < images.length; i++) {
        if (originalSrcs[i]) {
          images[i].src = originalSrcs[i];
        }
      }
    }
  }
}
