import { NgStyle } from '@angular/common';
import { Component, ElementRef, input, output, computed, signal, ViewChildren, QueryList } from '@angular/core';
import { DEFAULT_BOARD_DISPLAY_OPTIONS, type BoardDisplayOptions, type ProjectCard } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';

const DEFAULT_CARD_STYLE: Record<string, string> = {
  fontFamily: "system-ui, sans-serif",
  background: "linear-gradient(to bottom right, rgba(99,102,241,0.2), white, rgba(244,63,94,0.2))",
  color: "#0f172a",
};

/** Editable field keys for project boards (yarns, sizes). */
export const PROJECT_BOARD_EDITABLE_FIELDS = ['sizeMade', 'yarnUsed', 'needleSizes'] as const;

@Component({
  selector: 'app-assistant-board-card',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './assistant-board-card.html',
  styleUrl: './assistant-board-card.css',
})
export class AssistantBoardCard {
  card = input<ProjectCard | null>(null);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<BoardDisplayOptions | null>(null);
  /** Selected photo index within project or pattern photos (from gallery). */
  selectedPhotoIndex = input<number>(0);
  /** Object-position X % (0–100) for photo crop framing. */
  photoPositionX = input<number>(50);
  /** Object-position Y % (0–100) for photo crop framing. */
  photoPositionY = input<number>(50);
  /** When true, yarn/size fields are editable in place. */
  editable = input<boolean>(false);
  /** Overrides for field values (from parent); key = field name, value = display text. */
  fieldOverrides = input<Record<string, string> | null>(null);
  /** Emitted when user commits an edit (Enter or blur). */
  fieldOverrideChange = output<{ field: string; value: string }>();

  /** Which field is currently in edit mode, or null. */
  protected editingField = signal<string | null>(null);
  /** Temporary value while editing. */
  protected editValue = signal('');

  @ViewChildren('editInputRef') private editInputRefs?: QueryList<ElementRef<HTMLInputElement>>;

  protected isCanvaStyle = computed(() => this.design()?.canvaLayout === true);
  protected opts = computed(() => ({ ...DEFAULT_BOARD_DISPLAY_OPTIONS, ...this.displayOptions() }));

  /** One-line date text for bottom of card: only shown when start date is available and dates are enabled. */
  protected dateLine = computed(() => {
    const c = this.card();
    const opts = this.opts();
    if (!c || (!opts.showStartDate && !opts.showCompletedDate)) return null;
    const start = this.parseAndFormatDate(c.started);
    if (!start) return null;
    const end = this.parseAndFormatDate(c.completed);
    if (end) return `${start} – ${end}`;
    return `${start} – In progress`;
  });

  private parseAndFormatDate(iso?: string): string | null {
    if (!iso || typeof iso !== 'string') return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  /** Image URL to display: from project/pattern photos by selected index, or fallback to card.imageUrl. */
  protected displayImageUrl = computed(() => {
    const c = this.card();
    const opts = this.opts();
    if (!c || !opts.showPhoto) return null;
    const idx = this.selectedPhotoIndex();
    const source = opts.photoSource ?? 'project';
    const list =
      source === 'pattern'
        ? (c.patternPhotos ?? [])
        : (c.projectPhotos ?? (c.imageUrl ? [c.imageUrl] : []));
    const url = list[idx] ?? list[0];
    return url ?? c.imageUrl ?? null;
  });

  protected cardStyle = computed(() => {
    const d = this.design();
    if (!d?.style) return DEFAULT_CARD_STYLE;
    return { ...DEFAULT_CARD_STYLE, ...d.style };
  });

  /** Display value for a field (override or card value). */
  protected displayValue(field: string): string {
    const overrides = this.fieldOverrides();
    if (overrides && field in overrides) return overrides[field];
    const c = this.card();
    if (!c) return '';
    const v = (c as Record<string, unknown>)[field];
    return typeof v === 'string' ? v : '';
  }

  protected startEdit(field: string): void {
    if (!this.editable()) return;
    this.editValue.set(this.displayValue(field));
    this.editingField.set(field);
    setTimeout(() => this.editInputRefs?.first?.nativeElement?.focus(), 0);
  }

  protected commitEdit(): void {
    const field = this.editingField();
    if (!field) return;
    const value = this.editValue().trim();
    this.fieldOverrideChange.emit({ field, value });
    this.editingField.set(null);
  }
}
