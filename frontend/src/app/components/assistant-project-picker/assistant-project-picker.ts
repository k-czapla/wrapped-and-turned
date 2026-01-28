import { Component, input, output } from '@angular/core';
import type { WrappedStats } from '../../services/api';

type ProjectItem = WrappedStats['projects'][number];

@Component({
  selector: 'app-assistant-project-picker',
  templateUrl: './assistant-project-picker.html',
  styleUrl: './assistant-project-picker.css',
})
export class AssistantProjectPicker {
  projects = input.required<ProjectItem[]>();
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
    const next = this.projects().map((p) => p.id).sort((a, b) => a - b);
    this.selectionChange.emit(next);
  }

  clearSelection() {
    this.selectionChange.emit([]);
  }
}
