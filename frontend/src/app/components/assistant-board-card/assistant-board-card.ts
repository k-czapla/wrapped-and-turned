import { Component, input } from '@angular/core';
import type { ProjectCard } from '../../services/api';

@Component({
  selector: 'app-assistant-board-card',
  standalone: true,
  templateUrl: './assistant-board-card.html',
  styleUrl: './assistant-board-card.css',
})
export class AssistantBoardCard {
  card = input<ProjectCard | null>(null);
}
