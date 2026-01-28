import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Api, type StatPreferences, type WrappedStats } from '../../services/api';
import { WrappedControls } from '../../components/wrapped-controls/wrapped-controls';
import { WrappedTotals } from '../../components/wrapped-totals/wrapped-totals';
import { WrappedCraftChart } from '../../components/wrapped-craft-chart/wrapped-craft-chart';
import { WrappedHighlights } from '../../components/wrapped-highlights/wrapped-highlights';
import { WrappedProjectsGallery } from '../../components/wrapped-projects-gallery/wrapped-projects-gallery';

@Component({
  selector: 'app-wrapped',
  imports: [
    WrappedControls,
    WrappedTotals,
    WrappedCraftChart,
    WrappedHighlights,
    WrappedProjectsGallery,
  ],
  templateUrl: './wrapped.html',
  styleUrl: './wrapped.css',
})
export class Wrapped implements OnInit {
  protected loading = false;
  protected error: string | null = null;

  protected from = defaultFrom();
  protected to = defaultTo();

  protected stats: WrappedStats | null = null;
  /** User's stat visibility preferences; null until loaded (then show all). */
  protected statPreferences: StatPreferences | null = null;

  protected craftChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [] }] };
  protected craftChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
    },
  };

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.api.getStatPreferences().subscribe({
      next: (p) => {
        this.statPreferences = p;
        this.cdr.detectChanges();
      },
      error: () => {
        this.statPreferences = null;
        this.cdr.detectChanges();
      },
    });
  }

  protected showCraftSection(): boolean {
    const p = this.statPreferences;
    return !p || p['craftBreakdown'] || p['mostProductiveMonth'];
  }

  protected showHighlights(): boolean {
    const p = this.statPreferences;
    return !p || p['avgDurationDays'];
  }

  protected showProjectsGallery(): boolean {
    const p = this.statPreferences;
    return !p || p['projectsGallery'];
  }

  generate() {
    this.loading = true;
    this.error = null;
    this.stats = null;
    this.cdr.detectChanges();

    this.api.getWrapped(this.from, this.to).subscribe({
      next: (s) => {
        try {
          this.stats = s ?? null;
          const craft =
            s && typeof s === 'object' && s.breakdowns && typeof s.breakdowns === 'object'
              ? (s.breakdowns as { craft?: Record<string, number> }).craft
              : undefined;
          const entries = Object.entries(craft ?? {}).sort((a, b) => b[1] - a[1]);
          this.craftChartData = {
            labels: entries.map(([k]) => k),
            datasets: [{ data: entries.map(([, v]) => v) }],
          };
        } catch {
          this.error = 'Invalid response from server. Please try again.';
          this.stats = null;
        } finally {
          this.loading = false;
        }
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? 'Failed to load wrapped stats. Are you logged in?';
        this.cdr.detectChanges();
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
