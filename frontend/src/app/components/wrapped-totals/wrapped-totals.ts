import { Component, input } from '@angular/core';
import type { StatPreferences, WrappedStats } from '../../services/api';
import { WrappedStatCard } from '../wrapped-stat-card/wrapped-stat-card';

@Component({
  selector: 'app-wrapped-totals',
  imports: [WrappedStatCard],
  templateUrl: './wrapped-totals.html',
  styleUrl: './wrapped-totals.css',
})
export class WrappedTotals {
  totals = input.required<WrappedStats['totals']>();
  /** When set, only show stat cards that are enabled. When null/undefined, show all. */
  statPreferences = input<StatPreferences | null>(null);
}
