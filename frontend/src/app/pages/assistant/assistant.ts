import { Component } from '@angular/core';
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
  protected selectedProjectId: number | null = null;
  protected card: ProjectCard | null = null;

  constructor(private api: Api) { }

  loadProjects() {
    this.loading = true;
    this.error = null;
    this.wrapped = null;
    this.selectedProjectId = null;
    this.card = null;

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

  onSelectProject(id: number) {
    this.selectedProjectId = id;
    this.card = null;

    this.api.getProjectCard(id).subscribe({
      next: (c) => (this.card = c),
      error: () => (this.error = 'Failed to load project details.'),
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
