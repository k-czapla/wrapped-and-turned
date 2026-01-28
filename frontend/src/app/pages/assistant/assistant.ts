import { ChangeDetectorRef, Component } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Api, type ProjectCard, type WrappedStats } from '../../services/api';
import { AssistantControls } from '../../components/assistant-controls/assistant-controls';
import { AssistantProjectPicker } from '../../components/assistant-project-picker/assistant-project-picker';
import { AssistantBoardPreview } from '../../components/assistant-board-preview/assistant-board-preview';

@Component({
  selector: 'app-assistant',
  imports: [AssistantControls, AssistantProjectPicker, AssistantBoardPreview],
  templateUrl: './assistant.html',
  styleUrl: './assistant.css',
})
export class Assistant {
  protected loading = false;
  protected error: string | null = null;

  protected from = defaultFrom();
  protected to = defaultTo();

  protected wrapped: WrappedStats | null = null;
  protected selectedProjectIds: number[] = [];
  protected cards: ProjectCard[] = [];
  protected cardsLoading = false;

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
  ) { }

  loadProjects() {
    this.loading = true;
    this.error = null;
    this.wrapped = null;
    this.selectedProjectIds = [];
    this.cards = [];

    this.api.getWrapped(this.from, this.to).subscribe({
      next: (s) => {
        const normalized = normalizeWrapped(s);
        if (normalized) {
          this.wrapped = normalized;
          this.error = null;
        } else {
          this.error = (s && typeof s === 'object' && typeof (s as Record<string, unknown>).error === 'string')
            ? (s as { error: string }).error
            : 'Invalid response from server.';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? 'Failed to load projects. Are you logged in?';
        this.cdr.markForCheck();
      },
    });
  }

  onSelectionChange(ids: number[]) {
    this.selectedProjectIds = ids;
    this.error = null;

    if (ids.length === 0) {
      this.cards = [];
      this.cdr.markForCheck();
      return;
    }

    this.cardsLoading = true;
    forkJoin(ids.map((id) => this.api.getProjectCard(id))).subscribe({
      next: (cardList) => {
        this.cards = cardList;
        this.cardsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.cardsLoading = false;
        this.error = 'Failed to load project details for one or more projects.';
        this.cdr.markForCheck();
      },
    });
  }
}

function normalizeWrapped(raw: unknown): WrappedStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.error === 'string') return null;
  const projects = Array.isArray(s.projects) ? s.projects : [];
  const range = s.range && typeof s.range === 'object' && 'from' in s.range && 'to' in s.range
    ? (s.range as WrappedStats['range'])
    : { from: '', to: '' };
  const totals = s.totals && typeof s.totals === 'object'
    ? (s.totals as WrappedStats['totals'])
    : { projects: 0, finishedProjects: 0, totalYardage: 0, totalMeterage: 0 };
  const breakdowns = s.breakdowns && typeof s.breakdowns === 'object'
    ? (s.breakdowns as WrappedStats['breakdowns'])
    : { craft: {} };
  const highlights = s.highlights && typeof s.highlights === 'object'
    ? (s.highlights as WrappedStats['highlights'])
    : {};
  return { range, totals, breakdowns, highlights, projects: projects as WrappedStats['projects'] };
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
  d.setMonth(d.getMonth() - 3);
  return isoDate(d);
}
