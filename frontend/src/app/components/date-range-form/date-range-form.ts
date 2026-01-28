import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-range-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './date-range-form.html',
  styleUrl: './date-range-form.css',
})
export class DateRangeForm {
  from = input.required<string>();
  to = input.required<string>();
  buttonLabel = input.required<string>();
  loadingLabel = input.required<string>();
  loading = input<boolean>(false);

  fromChange = output<string>();
  toChange = output<string>();
  submit = output<void>();

  onFromChange(value: string) {
    this.fromChange.emit(value);
  }

  onToChange(value: string) {
    this.toChange.emit(value);
  }

  onSubmit() {
    this.submit.emit();
  }
}
