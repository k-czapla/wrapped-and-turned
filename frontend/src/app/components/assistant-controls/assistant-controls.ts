import { Component, input, output } from '@angular/core';
import { DateRangeForm } from '../date-range-form/date-range-form';
import { ErrorAlert } from '../error-alert/error-alert';

@Component({
  selector: 'app-assistant-controls',
  imports: [DateRangeForm, ErrorAlert],
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
