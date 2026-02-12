import { Component, input, output } from '@angular/core';
import type { ProjectCard } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';
import { AssistantBoardCard } from '../assistant-board-card/assistant-board-card';

/** Same sample data as used in Podcaster's Assistant so the preview reflects real boards. */
const SAMPLE_PROJECT_CARD: ProjectCard = {
  id: 0,
  projectName: 'Cozy Cable Sweater',
  patternName: 'Cozy Cable Sweater',
  designerName: 'Jane Designer',
  sizeMade: 'M (38" chest)',
  yarnUsed: 'Malabrigo Ríos, 3 skeins',
  projectUrl: 'https://www.ravelry.com/projects/demo/example-project',
};

@Component({
  selector: 'app-board-design-card',
  standalone: true,
  imports: [AssistantBoardCard],
  templateUrl: './board-design-card.html',
  styleUrl: './board-design-card.css',
})
export class BoardDesignCard {
  design = input.required<ProjectBoardDesign>();
  selected = input<boolean>(false);
  selectedChange = output<void>();

  protected sampleCard = SAMPLE_PROJECT_CARD;
}
