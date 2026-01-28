import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Home } from './pages/home/home';
import { Wrapped } from './pages/wrapped/wrapped';
import { Assistant } from './pages/assistant/assistant';
import { StatsPreferences } from './pages/stats-preferences/stats-preferences';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'wrapped', component: Wrapped, canActivate: [authGuard] },
  { path: 'assistant', component: Assistant, canActivate: [authGuard] },
  { path: 'stats-preferences', component: StatsPreferences, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
