import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FeatureFlags } from '../services/feature-flags';

/**
 * Redirects to home when the Wrapped feature is disabled (WT_FEATURE_WRAPPED not set or not "true"/"1").
 * Use together with authGuard on the /wrapped route.
 */
export const wrappedFeatureGuard: CanActivateFn = () => {
  const featureFlags = inject(FeatureFlags);
  const router = inject(Router);
  if (featureFlags.wrappedEnabled()) return true;
  return router.createUrlTree(['/']);
};
