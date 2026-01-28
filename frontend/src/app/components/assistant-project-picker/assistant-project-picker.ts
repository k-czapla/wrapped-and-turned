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

  projectSelect = output<number>();

  onSelect(value: string) {
    const id = Number(value);
    if (Number.isFinite(id)) {
      this.projectSelect.emit(id);
    }
  }
}
