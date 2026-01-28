import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wrapped-projects-gallery-header',
  templateUrl: './wrapped-projects-gallery-header.html',
  styleUrl: './wrapped-projects-gallery-header.css',
})
export class WrappedProjectsGalleryHeader {
  title = input<string>('Projects');
  subtitle = input<string>('A quick gallery (uses the first photo when available)');
}
