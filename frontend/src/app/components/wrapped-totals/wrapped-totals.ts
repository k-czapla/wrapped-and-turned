import { Component, input } from '@angular/core';
import type { WrappedStats } from '../../services/api';
import { WrappedStatCard } from '../wrapped-stat-card/wrapped-stat-card';

@Component({
  selector: 'app-wrapped-totals',
  imports: [WrappedStatCard],
  templateUrl: './wrapped-totals.html',
  styleUrl: './wrapped-totals.css',
})
export class WrappedTotals {
  totals = input.required<WrappedStats['totals']>();
}
