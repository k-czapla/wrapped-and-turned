import { NgStyle } from '@angular/common';
import { Component, input, computed } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';
import type { PatternRoundUpCard, PatternRoundUpDisplayOptions } from '../../services/api';
import type { ProjectBoardDesign } from '../../services/project-board-designs';

const DEFAULT_CARD_STYLE: Record<string, string> = {
  fontFamily: 'system-ui, sans-serif',
  background:
    'linear-gradient(to bottom right, rgba(99,102,241,0.2), white, rgba(244,63,94,0.2))',
  color: '#0f172a',
};

@Component({
  selector: 'app-assistant-pattern-board-card',
  standalone: true,
  imports: [NgStyle, QRCodeComponent],
  templateUrl: './assistant-pattern-board-card.html',
  styleUrl: './assistant-pattern-board-card.css',
})
export class AssistantPatternBoardCard {
  card = input<PatternRoundUpCard | null>(null);
  design = input<ProjectBoardDesign | null>(null);
  displayOptions = input<PatternRoundUpDisplayOptions | null>(null);
  selectedPhotoIndex = input<number>(0);

  protected opts = computed(() => ({
    showPhoto: true,
    showPatternName: true,
    showDesignerName: true,
    showSizesAvailable: true,
    showNeedleSizes: true,
    showGauge: true,
    showSuggestedYarn: true,
    showPrice: true,
    ...this.displayOptions(),
  }));

  protected patternUrl = computed(() => this.card()?.patternUrl ?? null);

  /** Formatted price line: e.g. "9.6 EUR" or "€ 9.60" when only currency code available. */
  protected priceLine = computed(() => {
    const c = this.card();
    if (!c) return '';
    const price = c.price;
    const currency = c.currency?.trim();
    if (price != null && Number.isFinite(price) && currency) return `${price} ${currency}`;
    if (price != null && Number.isFinite(price)) return String(price);
    if (currency) return currency;
    return '';
  });

  protected displayImageUrl = computed(() => {
    const c = this.card();
    const opts = this.opts();
    if (!c || !opts.showPhoto) return null;
    const list = c.patternPhotos ?? (c.imageUrl ? [c.imageUrl] : []);
    const idx = this.selectedPhotoIndex();
    const url = list[idx] ?? list[0];
    return url ?? c.imageUrl ?? null;
  });

  protected cardStyle = computed(() => {
    const d = this.design();
    if (!d?.style) return DEFAULT_CARD_STYLE;
    return { ...DEFAULT_CARD_STYLE, ...d.style };
  });
}
