import { ChangeDetectorRef, Component, computed } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Api, DEFAULT_BOARD_DISPLAY_OPTIONS, type BoardDisplayOptions, type ProjectCard, type WrappedStats } from '../../services/api';
import { BoardDesignService } from '../../services/board-design.service';
import { AssistantControls } from '../../components/assistant-controls/assistant-controls';
import { AssistantBoardOptions } from '../../components/assistant-board-options/assistant-board-options';
import { AssistantProjectPicker } from '../../components/assistant-project-picker/assistant-project-picker';
import { AssistantBoardPreview } from '../../components/assistant-board-preview/assistant-board-preview';
import { AssistantGenerateDescription } from '../../components/assistant-generate-description/assistant-generate-description';
import { AssistantThumbnailGenerator } from '../../components/assistant-thumbnail-generator/assistant-thumbnail-generator';

@Component({
  selector: 'app-assistant',
  imports: [
    AssistantControls,
    AssistantBoardOptions,
    AssistantProjectPicker,
    AssistantThumbnailGenerator,
    AssistantBoardPreview,
    AssistantGenerateDescription,
  ],
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

  /** Per-project selected photo index (within project or pattern photos list). */
  protected selectedPhotoIndexByProjectId: Record<number, number> = {};

  /** User-uploaded photo data URLs per project id (prepended to project photos in preview). */
  protected uploadedPhotosByProjectId: Record<number, string[]> = {};

  /** Photo source (project vs pattern) per project board. */
  protected photoSourceByProjectId: Record<number, 'project' | 'pattern'> = {};

  protected displayOptions: BoardDisplayOptions = { ...DEFAULT_BOARD_DISPLAY_OPTIONS };
  protected selectedDesign = computed(() => this.boardDesign.effectiveDesign());

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
  const totals = totalsVal && typeof totalsVal === 'object'
    ? (totalsVal as WrappedStats['totals'])
    : { projects: 0, finishedProjects: 0, totalYardage: 0, totalMeterage: 0 };
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
  d.setMonth(d.getMonth() - 3);
  return isoDate(d);
}
