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

  protected isCanvaStyle = computed(() => this.design()?.canvaLayout === true);
  protected opts = computed(() => this.displayOptions() ?? { ...DEFAULT_BOARD_DISPLAY_OPTIONS });

  /** Ravelry project page URL for the QR code; only set when card has projectUrl */
  protected projectUrl = computed(() => this.card()?.projectUrl ?? null);

  protected cardStyle = computed(() => {
    const d = this.design();
    if (!d?.style) return DEFAULT_CARD_STYLE;
    return { ...DEFAULT_CARD_STYLE, ...d.style };
  });
}
