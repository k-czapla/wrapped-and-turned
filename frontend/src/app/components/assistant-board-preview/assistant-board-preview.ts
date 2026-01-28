import { Component, ElementRef, input, ViewChild } from '@angular/core';
import { toPng } from 'html-to-image';
import type { ProjectCard } from '../../services/api';

@Component({
  selector: 'app-assistant-board-preview',
  templateUrl: './assistant-board-preview.html',
  styleUrl: './assistant-board-preview.css',
})
export class AssistantBoardPreview {
  card = input<ProjectCard | null>(null);
  selectedProjectId = input<number | null>(null);

  @ViewChild('board') private boardEl?: ElementRef<HTMLElement>;

  async downloadBoard() {
    if (!this.boardEl?.nativeElement) return;

    const dataUrl = await toPng(this.boardEl.nativeElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `wrapped-and-turned-project-${this.selectedProjectId() ?? 'board'}.png`;
    a.click();
  }
}
