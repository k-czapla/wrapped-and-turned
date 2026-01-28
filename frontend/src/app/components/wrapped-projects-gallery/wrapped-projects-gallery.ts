import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';
import { WrappedProjectCard } from '../wrapped-project-card/wrapped-project-card';
import { WrappedProjectsGalleryHeader } from '../wrapped-projects-gallery-header/wrapped-projects-gallery-header';

type ProjectItem = WrappedStats['projects'][number];

@Component({
  selector: 'app-wrapped-projects-gallery',
  imports: [WrappedProjectsGalleryHeader, WrappedProjectCard],
  templateUrl: './wrapped-projects-gallery.html',
  styleUrl: './wrapped-projects-gallery.css',
})
export class WrappedProjectsGallery {
  projects = input.required<ProjectItem[]>();
}
