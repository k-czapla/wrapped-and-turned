import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import type { StatPreferences } from '../../services/api';

@Component({
  selector: 'app-wrapped-craft-chart',
  imports: [BaseChartDirective],
  templateUrl: './wrapped-craft-chart.html',
  styleUrl: './wrapped-craft-chart.css',
})
export class WrappedCraftChart {
  chartData = input.required<ChartData<'doughnut'>>();
  chartOptions = input.required<ChartConfiguration<'doughnut'>['options']>();
  mostProductiveMonth = input<string | undefined>(undefined);
  /** When set, only show chart/most productive when enabled. When null, show both. */
  statPreferences = input<StatPreferences | null>(null);

  protected showChart(): boolean {
    const p = this.statPreferences();
    return !p || p['craftBreakdown'];
  }

  protected showMostProductive(): boolean {
    const p = this.statPreferences();
    return !p || p['mostProductiveMonth'];
  }
}
