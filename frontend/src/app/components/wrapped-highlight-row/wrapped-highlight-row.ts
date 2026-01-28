import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wrapped-highlight-row',
  standalone: true,
  templateUrl: './wrapped-highlight-row.html',
  styleUrl: './wrapped-highlight-row.css',
})
export class WrappedHighlightRow {
  label = input.required<string>();
  value = input.required<string>();
}
