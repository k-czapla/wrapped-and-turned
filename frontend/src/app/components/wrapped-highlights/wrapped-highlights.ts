import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';
import { WrappedHighlightRow } from '../wrapped-highlight-row/wrapped-highlight-row';

@Component({
  selector: 'app-wrapped-highlights',
  imports: [WrappedHighlightRow],
  templateUrl: './wrapped-highlights.html',
  styleUrl: './wrapped-highlights.css',
})
export class WrappedHighlights {
  highlights = input.required<WrappedStats['highlights']>();
  range = input.required<WrappedStats['range']>();
}
