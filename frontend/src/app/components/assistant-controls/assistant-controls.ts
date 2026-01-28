import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-assistant-controls',
  imports: [FormsModule],
  templateUrl: './assistant-controls.html',
  styleUrl: './assistant-controls.css',
})
export class AssistantControls {
  from = input.required<string>();
  to = input.required<string>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  fromChange = output<string>();
  toChange = output<string>();
  loadProjects = output<void>();

  onFromChange(value: string) {
    this.fromChange.emit(value);
  }

  onToChange(value: string) {
    this.toChange.emit(value);
  }

  onLoadProjects() {
    this.loadProjects.emit();
  }
}
