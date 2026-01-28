import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-wrapped-stat-card',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './wrapped-stat-card.html',
  styleUrl: './wrapped-stat-card.css',
})
export class WrappedStatCard {
  label = input.required<string>();
  value = input.required<string | number>();
  sublabel = input.required<string>();
}
