import { NgStyle } from '@angular/common';
import { Component, input, computed } from '@angular/core';
import type { ProjectCard } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';

const DEFAULT_CARD_STYLE: Record<string, string> = {
  fontFamily: "system-ui, sans-serif",
  background: "linear-gradient(to bottom right, rgba(99,102,241,0.2), white, rgba(244,63,94,0.2))",
  color: "#0f172a",
};

@Component({
  selector: 'app-assistant-board-card',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './assistant-board-card.html',
  styleUrl: './assistant-board-card.css',
})
export class AssistantBoardCard {
  card = input<ProjectCard | null>(null);
  design = input<ProjectBoardDesign | null>(null);

  protected isCanvaStyle = computed(() => this.design()?.canvaLayout === true);

  protected cardStyle = computed(() => {
    const d = this.design();
    if (!d?.style) return DEFAULT_CARD_STYLE;
    return { ...DEFAULT_CARD_STYLE, ...d.style };
  });
}
