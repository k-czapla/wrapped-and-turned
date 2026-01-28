import { NgFor, NgIf } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toPng } from 'html-to-image';
import { Api, type ProjectCard, type WrappedStats } from '../../services/api';

@Component({
  selector: 'app-assistant',
  imports: [NgIf, NgFor, FormsModule],
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

  @ViewChild('board') private boardEl?: ElementRef<HTMLElement>;

  constructor(private api: Api) {}

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

  onSelectProject(idStr: string) {
    const id = Number(idStr);
    if (!Number.isFinite(id)) return;
    this.selectedProjectId = id;
    this.card = null;

    this.api.getProjectCard(id).subscribe({
      next: (c) => (this.card = c),
      error: () => (this.error = 'Failed to load project details.'),
    });
  }

  async downloadBoard() {
    if (!this.boardEl?.nativeElement) return;

    const dataUrl = await toPng(this.boardEl.nativeElement, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
    });

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `wrapped-and-turned-project-${this.selectedProjectId ?? 'board'}.png`;
    a.click();
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
