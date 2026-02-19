import { Injectable } from '@angular/core';

const WRAPPED_PLACEHOLDER = '__WT_FEATURE_WRAPPED__';

/**
 * Reads feature flags injected at build time from meta tags
 * (see scripts/inject-backend-url.mjs and index.html).
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureFlags {
  /** True when WT_FEATURE_WRAPPED is "true" or "1" at build time. */
  wrappedEnabled(): boolean {
    const meta = document.querySelector('meta[name="wt-feature-wrapped"]') as HTMLMetaElement | null;
    const raw = (meta?.content ?? '').trim().toLowerCase();
    if (raw === WRAPPED_PLACEHOLDER) return true; // dev build before inject: show by default
    return raw === 'true' || raw === '1';
  }
}
