import { Component, input, output } from '@angular/core';
import { DateRangeForm } from '../date-range-form/date-range-form';
import { ErrorAlert } from '../error-alert/error-alert';

@Component({
  selector: 'app-wrapped-controls',
  imports: [DateRangeForm, ErrorAlert],
  templateUrl: './wrapped-controls.html',
  styleUrl: './wrapped-controls.css',
})
export class WrappedControls {
  from = input.required<string>();
  to = input.required<string>();
  loading = input<boolean>(false);
  error = input<string | null>(null);

  fromChange = output<string>();
  toChange = output<string>();
  generate = output<void>();

  onFromChange(value: string) {
    this.fromChange.emit(value);
  }

  onToChange(value: string) {
    this.toChange.emit(value);
  }

  onGenerate() {
    this.generate.emit();
  }
}
