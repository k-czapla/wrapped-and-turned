import { Component, ElementRef, inject, input, QueryList, ViewChildren } from '@angular/core';
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
  cards = input<ProjectCard[]>([]);
  cardsLoading = input<boolean>(false);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<BoardDisplayOptions | null>(null);

  @ViewChildren('board') private boardEls?: QueryList<ElementRef<HTMLElement>>;

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
