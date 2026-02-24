import { Component, input, output } from '@angular/core';
import type { PatternRoundUpCard } from '../../services/api';

@Component({
  selector: 'app-assistant-pattern-picker',
  standalone: true,
  templateUrl: './assistant-pattern-picker.html',
  styleUrl: './assistant-pattern-picker.css',
})
export class AssistantPatternPicker {
  patterns = input.required<PatternRoundUpCard[]>();
  selectedIds = input<number[]>([]);

  selectionChange = output<number[]>();

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  toggle(id: number) {
    const ids = this.selectedIds();
    const next = ids.includes(id)
      ? ids.filter((x) => x !== id)
      : [...ids, id].sort((a, b) => a - b);
    this.selectionChange.emit(next);
  }

  selectAll() {
    const next = this.patterns().map((p) => p.id).sort((a, b) => a - b);
    this.selectionChange.emit(next);
  }

  clearSelection() {
    this.selectionChange.emit([]);
  }
}
