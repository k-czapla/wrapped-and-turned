import { NgStyle } from '@angular/common';
import { Component, input, output } from '@angular/core';
import type { ProjectBoardDesign } from '../../services/project-board-designs';

@Component({
  selector: 'app-board-design-card',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './board-design-card.html',
  styleUrl: './board-design-card.css',
})
export class BoardDesignCard {
  design = input.required<ProjectBoardDesign>();
  selected = input<boolean>(false);
  selectedChange = output<void>();
}
