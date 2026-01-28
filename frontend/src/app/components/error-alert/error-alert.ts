import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-alert',
  standalone: true,
  templateUrl: './error-alert.html',
  styleUrl: './error-alert.css',
})
export class ErrorAlert {
  message = input.required<string>();
}
