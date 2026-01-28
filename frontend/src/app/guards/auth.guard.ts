import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, switchMap, take, tap } from 'rxjs';
import { Api } from '../services/api';

/**
 * Redirects to home when the user is not logged in.
 * Use on routes that require Ravelry authentication.
 */
export const authGuard: CanActivateFn = () => {
  const api = inject(Api);
  const router = inject(Router);

  return api.refreshMe().pipe(
    switchMap(() => api.me$.pipe(take(1))),
    map((me) => me != null),
    tap((isLoggedIn) => {
      if (!isLoggedIn) {
        router.navigate(['/']);
      }
    }),
  );
};
