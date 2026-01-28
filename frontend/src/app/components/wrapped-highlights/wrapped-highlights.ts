import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';

@Component({
  selector: 'app-wrapped-highlights',
  templateUrl: './wrapped-highlights.html',
  styleUrl: './wrapped-highlights.css',
})
export class WrappedHighlights {
  highlights = input.required<WrappedStats['highlights']>();
  range = input.required<WrappedStats['range']>();
}
