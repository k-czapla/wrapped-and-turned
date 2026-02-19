import { Component, input, signal } from '@angular/core';
import { Api, type GenerateDescriptionResult, type ProjectCard } from '../../services/api';
import { ErrorAlert } from '../error-alert/error-alert';

@Component({
  selector: 'app-assistant-generate-description',
  standalone: true,
  imports: [ErrorAlert],
  templateUrl: './assistant-generate-description.html',
  styleUrl: './assistant-generate-description.css',
})
export class AssistantGenerateDescription {
  /** Selected project cards (from project picker). */
  cards = input.required<ProjectCard[]>();
  /** Total finished objects in the loaded date range (from wrapped stats). */
  totalFinishedInRange = input<number | null>(null);

  protected optionalPrompt = '';
  protected generating = signal(false);
  protected error = signal<string | null>(null);
  protected result = signal<GenerateDescriptionResult | null>(null);

  constructor(private api: Api) { }

  protected get canGenerate(): boolean {
    const c = this.cards();
    return Array.isArray(c) && c.length > 0 && !this.generating();
  }

  protected onGenerate() {
    const c = this.cards();
    if (!Array.isArray(c) || c.length === 0 || this.generating()) return;

    this.error.set(null);
    this.result.set(null);
    this.generating.set(true);

    this.api.generateDescription(c, this.optionalPrompt || undefined).subscribe({
      next: (res) => {
        this.result.set(res);
        this.generating.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.error ?? err?.message ?? 'Failed to generate description. Please try again.';
        this.error.set(msg);
        this.generating.set(false);
      },
    });
  }

  /** Full show-notes text for copy. */
  protected fullText(r: GenerateDescriptionResult): string {
    const parts = [r.title, r.description, r.ravelryLinks, r.hashtags].filter(Boolean);
    return parts.join('\n\n');
  }

  protected async copyToClipboard(r: GenerateDescriptionResult) {
    const text = this.fullText(r);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: select and copy
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  }
}
