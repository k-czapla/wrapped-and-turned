import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';

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
}
