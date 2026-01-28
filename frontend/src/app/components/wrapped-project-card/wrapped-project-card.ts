import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';

export type WrappedProjectItem = WrappedStats['projects'][number];

@Component({
  selector: 'app-wrapped-project-card',
  templateUrl: './wrapped-project-card.html',
  styleUrl: './wrapped-project-card.css',
})
export class WrappedProjectCard {
  project = input.required<WrappedProjectItem>();
}
