import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wrapped-controls',
  imports: [FormsModule],
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
