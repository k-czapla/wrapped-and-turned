import { ChangeDetectorRef, Component, inject, input, output } from '@angular/core';
import { ErrorAlert } from '../error-alert/error-alert';
import type { BundleListItem, PatternRoundUpCard } from '../../services/api';
import { Api } from '../../services/api';

@Component({
  selector: 'app-assistant-bundle-controls',
  standalone: true,
  imports: [ErrorAlert],
  templateUrl: './assistant-bundle-controls.html',
  styleUrl: './assistant-bundle-controls.css',
})
export class AssistantBundleControls {
  private api = inject(Api);
  private cdr = inject(ChangeDetectorRef);

  loading = input<boolean>(false);
  error = input<string | null>(null);

  bundlesLoaded = output<BundleListItem[]>();
  bundleSelected = output<{ bundleId: number; bundleName?: string; patternCards: PatternRoundUpCard[] }>();
  loadError = output<string | null>();

  protected bundles: BundleListItem[] = [];
  protected bundlesLoading = false;
  protected selectedBundleId: number | null = null;
  protected loadPatternsLoading = false;

  protected loadBundles() {
    this.bundlesLoading = true;
    this.loadError.emit(null);
    this.api.getBundles().subscribe({
      next: (res) => {
        this.bundles = res.bundles ?? [];
        this.bundlesLoaded.emit(this.bundles);
        this.bundlesLoading = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.loadError.emit(e?.error?.error ?? 'Failed to load bundles. Are you logged in?');
        this.bundlesLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  protected onBundleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const id = select.value ? Number(select.value) : null;
    this.selectedBundleId = id;
    if (id == null || !Number.isFinite(id)) return;
    this.loadPatternsLoading = true;
    this.loadError.emit(null);
    this.api.getBundleWithPatterns(id).subscribe({
      next: (res) => {
        this.bundleSelected.emit({
          bundleId: res.bundle.id,
          bundleName: res.bundle.name,
          patternCards: res.patternCards ?? [],
        });
        this.loadPatternsLoading = false;
        this.cdr.markForCheck();
      },
      error: (e) => {
        this.loadError.emit(e?.error?.error ?? 'Failed to load bundle.');
        this.loadPatternsLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
