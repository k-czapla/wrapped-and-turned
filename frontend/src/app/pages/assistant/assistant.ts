import { ChangeDetectorRef, Component, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  Api,
  DEFAULT_BOARD_DISPLAY_OPTIONS,
  DEFAULT_PATTERN_ROUND_UP_DISPLAY_OPTIONS,
  type BoardDisplayOptions,
  type PatternRoundUpCard,
  type PatternRoundUpDisplayOptions,
  type ProjectCard,
  type WrappedStats,
} from '../../services/api';
import { BoardDesignService } from '../../services/board-design.service';
import { AssistantModeSelector, type AssistantMode } from '../../components/assistant-mode-selector/assistant-mode-selector';
import { AssistantControls } from '../../components/assistant-controls/assistant-controls';
import { AssistantBoardOptions } from '../../components/assistant-board-options/assistant-board-options';
import { AssistantProjectPicker } from '../../components/assistant-project-picker/assistant-project-picker';
import { AssistantBoardPreview } from '../../components/assistant-board-preview/assistant-board-preview';
import { AssistantGenerateDescription } from '../../components/assistant-generate-description/assistant-generate-description';
import { AssistantBundleControls } from '../../components/assistant-bundle-controls/assistant-bundle-controls';
import { AssistantPatternPicker } from '../../components/assistant-pattern-picker/assistant-pattern-picker';
import { AssistantPatternBoardOptions } from '../../components/assistant-pattern-board-options/assistant-pattern-board-options';
import { AssistantPatternBoardPreview } from '../../components/assistant-pattern-board-preview/assistant-pattern-board-preview';

@Component({
  selector: 'app-assistant',
  imports: [
    AssistantModeSelector,
    AssistantControls,
    AssistantBoardOptions,
    AssistantProjectPicker,
    AssistantBoardPreview,
    AssistantGenerateDescription,
    AssistantBundleControls,
    AssistantPatternPicker,
    AssistantPatternBoardOptions,
    AssistantPatternBoardPreview,
  ],
  templateUrl: './assistant.html',
  styleUrl: './assistant.css',
})
export class Assistant {
  protected mode: AssistantMode = 'project-update';
  protected loading = false;
  protected error: string | null = null;

  protected from = defaultFrom();
  protected to = defaultTo();

  protected wrapped: WrappedStats | null = null;
  protected selectedProjectIds: number[] = [];
  protected cards: ProjectCard[] = [];
  protected cardsLoading = false;

  /** Pattern Round Up: all pattern cards from selected bundle. */
  protected bundlePatternCards = signal<PatternRoundUpCard[]>([]);
  /** Pattern Round Up: name of last selected bundle (for empty-state message). */
  protected lastSelectedBundleName: string | null = null;
  /** Pattern Round Up: selected pattern ids for boards. */
  protected selectedPatternIds = signal<number[]>([]);
  /** Pattern Round Up: per-pattern selected photo index. */
  protected selectedPhotoIndexByPatternId: Record<number, number> = {};

  /** Per-project selected photo index (within project or pattern photos list). */
  protected selectedPhotoIndexByProjectId: Record<number, number> = {};

  /** User-uploaded photo data URLs per project id (prepended to project photos in preview). */
  protected uploadedPhotosByProjectId: Record<number, string[]> = {};

  /** Photo source (project vs pattern) per project board. */
  protected photoSourceByProjectId: Record<number, 'project' | 'pattern'> = {};

  protected displayOptions: BoardDisplayOptions = { ...DEFAULT_BOARD_DISPLAY_OPTIONS };
  protected patternRoundUpDisplayOptions: PatternRoundUpDisplayOptions = {
    ...DEFAULT_PATTERN_ROUND_UP_DISPLAY_OPTIONS,
  };
  protected selectedDesign = computed(() => this.boardDesign.effectiveDesign());

  /** Pattern Round Up: cards for selected patterns only (for preview and description). */
  protected selectedPatternCards = computed(() => {
    const ids = new Set(this.selectedPatternIds());
    return this.bundlePatternCards().filter((p) => ids.has(p.id));
  });

  /** Count of selected cards that are finished objects (completed date within loaded range). Used for title "X FOs". */
  get selectedFOCount(): number {
    const w = this.wrapped;
    const range = w?.range;
    if (!range?.from || !range?.to) return 0;
    const fromD = new Date(range.from);
    const toD = new Date(range.to);
    if (Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return 0;
    return this.cards.filter((c) => completedInRange(c.completed, fromD, toD)).length;
  }

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
    private boardDesign: BoardDesignService,
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
          const err = s && typeof s === 'object' ? (s as Record<string, unknown>)['error'] : undefined;
          this.error = typeof err === 'string' ? err : 'Invalid response from server.';
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
    this.selectedPhotoIndexByProjectId = {};
    this.photoSourceByProjectId = {};

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

  onSelectedPhotoIndexChange(projectId: number, index: number) {
    this.selectedPhotoIndexByProjectId = { ...this.selectedPhotoIndexByProjectId, [projectId]: index };
    this.cdr.markForCheck();
  }

  /** Cards with user-uploaded photos prepended to project and pattern photos for display. */
  get cardsWithUploadedPhotos(): ProjectCard[] {
    return this.cards.map((card) => {
      const uploaded = this.uploadedPhotosByProjectId[card.id];
      if (!uploaded?.length) return card;
      const projectPhotos = [...uploaded, ...(card.projectPhotos ?? (card.imageUrl ? [card.imageUrl] : []))];
      const patternPhotos = card.patternPhotos?.length
        ? [...uploaded, ...card.patternPhotos]
        : undefined;
      return { ...card, projectPhotos, ...(patternPhotos && { patternPhotos }) };
    });
  }

  onPhotoSourceChange(projectId: number, source: 'project' | 'pattern') {
    this.photoSourceByProjectId = { ...this.photoSourceByProjectId, [projectId]: source };
    this.cdr.markForCheck();
  }

  onPhotoUpload(projectId: number, dataUrl: string) {
    const list = this.uploadedPhotosByProjectId[projectId] ?? [];
    const newList = [...list, dataUrl];
    this.uploadedPhotosByProjectId = {
      ...this.uploadedPhotosByProjectId,
      [projectId]: newList,
    };
    this.selectedPhotoIndexByProjectId = { ...this.selectedPhotoIndexByProjectId, [projectId]: newList.length - 1 };
    this.cdr.markForCheck();
  }

  protected setMode(m: AssistantMode) {
    this.mode = m;
    this.error = null;
    if (m === 'pattern-round-up') {
      this.wrapped = null;
      this.selectedProjectIds = [];
      this.cards = [];
      this.bundlePatternCards.set([]);
      this.lastSelectedBundleName = null;
      this.selectedPatternIds.set([]);
    } else {
      this.bundlePatternCards.set([]);
      this.lastSelectedBundleName = null;
      this.selectedPatternIds.set([]);
    }
    this.cdr.markForCheck();
  }

  protected onBundleSelected(payload: {
    bundleId: number;
    bundleName?: string;
    patternCards: PatternRoundUpCard[];
  }) {
    this.error = null;
    this.lastSelectedBundleName = payload.bundleName ?? `Bundle ${payload.bundleId}`;
    this.bundlePatternCards.set(payload.patternCards);
    this.selectedPatternIds.set([]);
    this.selectedPhotoIndexByPatternId = {};
    this.cdr.markForCheck();
  }

  protected onPatternSelectionChange(ids: number[]) {
    this.selectedPatternIds.set(ids);
    this.cdr.markForCheck();
  }

  protected onPatternPhotoIndexChange(patternId: number, index: number) {
    this.selectedPhotoIndexByPatternId = {
      ...this.selectedPhotoIndexByPatternId,
      [patternId]: index,
    };
    this.cdr.markForCheck();
  }
}

function completedInRange(completed: string | undefined, from: Date, to: Date): boolean {
  if (!completed) return false;
  const d = new Date(completed);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
}

function normalizeWrapped(raw: unknown): WrappedStats | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (typeof s['error'] === 'string') return null;
  const projects = Array.isArray(s['projects']) ? s['projects'] : [];
  const rangeVal = s['range'];
  const range = rangeVal && typeof rangeVal === 'object' && 'from' in rangeVal && 'to' in rangeVal
    ? (rangeVal as WrappedStats['range'])
    : { from: '', to: '' };
  const totalsVal = s['totals'];
  const t = totalsVal && typeof totalsVal === 'object' ? (totalsVal as Record<string, unknown>) : null;
  const totals: WrappedStats['totals'] = {
    projects: typeof t?.['projects'] === 'number' && t['projects'] >= 0 ? t['projects'] : 0,
    finishedProjects:
      typeof t?.['finishedProjects'] === 'number' && t['finishedProjects'] >= 0
        ? t['finishedProjects']
        : 0,
    totalYardage:
      typeof t?.['totalYardage'] === 'number' && t['totalYardage'] >= 0 ? t['totalYardage'] : 0,
    totalMeterage:
      typeof t?.['totalMeterage'] === 'number' && t['totalMeterage'] >= 0 ? t['totalMeterage'] : 0,
  };
  const breakdowns = s['breakdowns'] && typeof s['breakdowns'] === 'object'
    ? (s['breakdowns'] as WrappedStats['breakdowns'])
    : { craft: {} };
  const highlights = s['highlights'] && typeof s['highlights'] === 'object'
    ? (s['highlights'] as WrappedStats['highlights'])
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
  d.setDate(d.getDate() - 30);
  return isoDate(d);
}
