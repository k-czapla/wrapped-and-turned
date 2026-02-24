import { Component, input, signal } from '@angular/core';
import {
  Api,
  type GenerateDescriptionResult,
  type PatternRoundUpCard,
  type ProjectCard,
} from '../../services/api';
import { ErrorAlert } from '../error-alert/error-alert';

@Component({
  selector: 'app-assistant-generate-description',
  standalone: true,
  imports: [ErrorAlert],
  templateUrl: './assistant-generate-description.html',
  styleUrl: './assistant-generate-description.css',
})
export class AssistantGenerateDescription {
  /** Selected project cards (from project picker). Used when mode is project-update. */
  cards = input<ProjectCard[]>([]);
  /** Selected pattern cards (from pattern round up). When non-empty, description is generated for pattern round up. */
  patternCards = input<PatternRoundUpCard[]>([]);
  /** Total finished objects in the loaded date range (from wrapped stats). */
  totalFinishedInRange = input<number | null>(null);
  /** Count of selected cards that are FOs (completed in range). Used for title "X FOs". If null/undefined, backend uses cards.length. */
  selectedFOCount = input<number | null>(null);

  protected optionalPrompt = '';
  protected generating = signal(false);
  protected error = signal<string | null>(null);
  protected result = signal<GenerateDescriptionResult | null>(null);

  constructor(private api: Api) {}

  /** True when we have something to generate for (projects or patterns). */
  protected get canGenerate(): boolean {
    const pc = this.patternCards();
    const c = this.cards();
    const hasPatterns = Array.isArray(pc) && pc.length > 0;
    const hasProjects = Array.isArray(c) && c.length > 0;
    return (hasPatterns || hasProjects) && !this.generating();
  }

  /** True when in pattern round up mode (pattern cards provided and selected). */
  protected get isPatternRoundUp(): boolean {
    const pc = this.patternCards();
    return Array.isArray(pc) && pc.length > 0;
  }

  protected onGenerate() {
    if (this.generating()) return;
    const pc = this.patternCards();
    const c = this.cards();
    const hasPatterns = Array.isArray(pc) && pc.length > 0;
    const hasProjects = Array.isArray(c) && c.length > 0;

    this.error.set(null);
    this.result.set(null);
    this.generating.set(true);

    if (hasPatterns) {
      this.api
        .generatePatternRoundUpDescription(pc, this.optionalPrompt || undefined)
        .subscribe({
          next: (res) => {
            this.result.set(res);
            this.generating.set(false);
          },
          error: (err) => {
            this.error.set(
              err?.error?.error ?? err?.message ?? 'Failed to generate description. Please try again.'
            );
            this.generating.set(false);
          },
        });
      return;
    }
    if (hasProjects) {
      const foCount =
        this.selectedFOCount() != null && Number.isInteger(this.selectedFOCount())
          ? this.selectedFOCount()!
          : undefined;
      this.api.generateDescription(c, this.optionalPrompt || undefined, foCount).subscribe({
        next: (res) => {
          this.result.set(res);
          this.generating.set(false);
        },
        error: (err) => {
          this.error.set(
            err?.error?.error ?? err?.message ?? 'Failed to generate description. Please try again.'
          );
          this.generating.set(false);
        },
      });
    } else {
      this.generating.set(false);
    }
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
