import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Api, type WrappedStats } from '../../services/api';

@Component({
  selector: 'app-wrapped',
  imports: [NgIf, NgFor, FormsModule, BaseChartDirective, DecimalPipe],
  templateUrl: './wrapped.html',
  styleUrl: './wrapped.css',
})
export class Wrapped {
  protected loading = false;
  protected error: string | null = null;

  protected from = defaultFrom();
  protected to = defaultTo();

  protected stats: WrappedStats | null = null;

  protected craftChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  protected craftChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  constructor(private api: Api) {}

  generate() {
    this.loading = true;
    this.error = null;
    this.stats = null;

    this.api.getWrapped(this.from, this.to).subscribe({
      next: (s) => {
        this.stats = s;
        const entries = Object.entries(s.breakdowns.craft ?? {}).sort((a, b) => b[1] - a[1]);
        this.craftChartData = {
          labels: entries.map(([k]) => k),
          datasets: [
            {
              data: entries.map(([, v]) => v),
            },
          ],
        };
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? 'Failed to load wrapped stats. Are you logged in?';
      },
    });
  }
}

function isoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultTo() {
  return isoDate(new Date());
}

function defaultFrom() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return isoDate(d);
}
