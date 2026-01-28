import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';

@Component({
  selector: 'app-wrapped-totals',
  imports: [DecimalPipe],
  templateUrl: './wrapped-totals.html',
  styleUrl: './wrapped-totals.css',
})
export class WrappedTotals {
  totals = input.required<WrappedStats['totals']>();
}
