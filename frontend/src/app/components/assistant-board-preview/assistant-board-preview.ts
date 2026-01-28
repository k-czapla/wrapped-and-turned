import { Component, ElementRef, input, QueryList, ViewChildren } from '@angular/core';
import { toPng } from 'html-to-image';
import type { ProjectCard } from '../../services/api';
import { AssistantBoardCard } from '../assistant-board-card/assistant-board-card';

@Component({
  selector: 'app-assistant-board-preview',
  imports: [AssistantBoardCard],
  templateUrl: './assistant-board-preview.html',
  styleUrl: './assistant-board-preview.css',
})
export class AssistantBoardPreview {
  cards = input<ProjectCard[]>([]);
  cardsLoading = input<boolean>(false);

  @ViewChildren('board') private boardEls?: QueryList<ElementRef<HTMLElement>>;

  async downloadBoard(index: number) {
    const el = this.boardEls?.get(index)?.nativeElement;
    if (!el) return;

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
  }
}
