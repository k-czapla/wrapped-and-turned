import { Component } from '@angular/core';
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

  constructor(private api: Api) { }

  loadProjects() {
    this.loading = true;
    this.error = null;
    this.wrapped = null;
    this.selectedProjectIds = [];
    this.cards = [];

    this.api.getWrapped(this.from, this.to).subscribe({
      next: (s) => {
        this.wrapped = s;
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? 'Failed to load projects. Are you logged in?';
      },
    });
  }

  onSelectionChange(ids: number[]) {
    this.selectedProjectIds = ids;
    this.error = null;

    if (ids.length === 0) {
      this.cards = [];
      return;
    }

    this.cardsLoading = true;
    forkJoin(ids.map((id) => this.api.getProjectCard(id))).subscribe({
      next: (cardList) => {
        this.cards = cardList;
        this.cardsLoading = false;
      },
      error: () => {
        this.cardsLoading = false;
        this.error = 'Failed to load project details for one or more projects.';
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
  d.setMonth(d.getMonth() - 3);
  return isoDate(d);
}
