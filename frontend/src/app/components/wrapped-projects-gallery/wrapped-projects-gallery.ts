import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';

type ProjectItem = WrappedStats['projects'][number];

@Component({
  selector: 'app-wrapped-projects-gallery',
  templateUrl: './wrapped-projects-gallery.html',
  styleUrl: './wrapped-projects-gallery.css',
})
export class WrappedProjectsGallery {
  projects = input.required<ProjectItem[]>();
}
