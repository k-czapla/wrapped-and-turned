import { Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import { Api, type ProjectCard, type ThumbnailMood } from '../../services/api';
import { ErrorAlert } from '../error-alert/error-alert';

export const THUMBNAIL_MOODS: { value: ThumbnailMood; label: string }[] = [
  { value: 'cozy', label: 'Cozy & warm' },
  { value: 'bold', label: 'Bold & playful' },
  { value: 'minimal', label: 'Minimal & clean' },
];

export type ThumbnailPhotoItem = { id: string; url: string };

@Component({
  selector: 'app-assistant-thumbnail-generator',
  standalone: true,
  imports: [ErrorAlert],
  templateUrl: './assistant-thumbnail-generator.html',
  styleUrl: './assistant-thumbnail-generator.css',
})
export class AssistantThumbnailGenerator {
  /** Selected project cards (with photos). */
  cards = input.required<ProjectCard[]>();
  /** User-uploaded photos per project id (from parent). */
  uploadedPhotosByProjectId = input<Record<number, string[]>>({});

  protected userPrompt = '';
  protected mood = signal<ThumbnailMood>('cozy');
  protected selectedPhotoIds = signal<Set<string>>(new Set());
  protected localUploads = signal<string[]>([]);
  protected generating = signal(false);
  protected error = signal<string | null>(null);
  protected resultBlobUrl = signal<string | null>(null);
  protected carouselTrack = viewChild<ElementRef<HTMLDivElement>>('carouselTrack');

  readonly moods = THUMBNAIL_MOODS;
  readonly maxSelectedPhotos = 3;

  constructor(private api: Api) {}

  /** All candidate photos: project photos from cards + uploaded by project + local uploads. */
  protected candidatePhotos = computed<ThumbnailPhotoItem[]>(() => {
    const cards = this.cards();
    const uploadedByProject = this.uploadedPhotosByProjectId();
    const local = this.localUploads();
    const list: ThumbnailPhotoItem[] = [];
    let id = 0;
    for (const url of local) {
      list.push({ id: `local-${id++}`, url });
    }
    for (const card of cards) {
      const uploads = uploadedByProject[card.id] ?? [];
      const projectPhotos = card.projectPhotos ?? (card.imageUrl ? [card.imageUrl] : []);
      const patternPhotos = card.patternPhotos ?? [];
      const allFromCard = [...uploads, ...projectPhotos, ...patternPhotos];
      for (const url of allFromCard) {
        if (url) list.push({ id: `card-${card.id}-${id++}`, url });
      }
    }
    return list;
  });

  protected get canGenerate(): boolean {
    return this.cards().length > 0 && !this.generating();
  }

  protected isSelected(item: ThumbnailPhotoItem): boolean {
    return this.selectedPhotoIds().has(item.id);
  }

  protected togglePhoto(item: ThumbnailPhotoItem): void {
    const set = new Set(this.selectedPhotoIds());
    if (set.has(item.id)) {
      set.delete(item.id);
    } else if (set.size < this.maxSelectedPhotos) {
      set.add(item.id);
    }
    this.selectedPhotoIds.set(set);
  }

  protected setMood(value: ThumbnailMood): void {
    this.mood.set(value);
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      this.localUploads.update((list) => [...list, dataUrl]);
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  protected onGenerate(): void {
    if (!this.canGenerate) return;
    const cards = this.cards();
    const projectNames = cards.map((c) => c.patternName || c.projectName).filter(Boolean);
    if (projectNames.length === 0) {
      this.error.set('No project names available.');
      return;
    }
    this.error.set(null);
    const previousUrl = this.resultBlobUrl();
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    this.resultBlobUrl.set(null);
    this.generating.set(true);

    this.api
      .generateThumbnail(projectNames, this.mood(), this.userPrompt || undefined)
      .subscribe({
        next: (data: Blob | ArrayBuffer) => {
          const blob = data instanceof Blob ? data : new Blob([data]);
          const url = URL.createObjectURL(blob);
          this.resultBlobUrl.set(url);
          this.generating.set(false);
        },
        error: async (err) => {
          this.generating.set(false);
          let message = err?.message ?? 'Failed to generate thumbnail.';
          if (err?.error instanceof Blob) {
            try {
              const text = await err.error.text();
              const json = JSON.parse(text) as { error?: string };
              if (json.error) message = json.error;
            } catch {
              // keep default message
            }
          } else if (typeof err?.error?.error === 'string') {
            message = err.error.error;
          }
          this.error.set(message);
        },
      });
  }

  protected downloadResult(): void {
    const url = this.resultBlobUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `thumbnail-${Date.now()}.png`;
    a.click();
  }

  protected carouselPrev(): void {
    const el = this.carouselTrack()?.nativeElement;
    if (!el) return;
    const itemWidth = 80 + 8; // item width + gap
    el.scrollBy({ left: -itemWidth, behavior: 'smooth' });
  }

  protected carouselNext(): void {
    const el = this.carouselTrack()?.nativeElement;
    if (!el) return;
    const itemWidth = 80 + 8;
    el.scrollBy({ left: itemWidth, behavior: 'smooth' });
  }
}
