import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { wrappedFeatureGuard } from './guards/wrapped-feature.guard';
import { Home } from './pages/home/home';
import { Wrapped } from './pages/wrapped/wrapped';
import { Assistant } from './pages/assistant/assistant';
import { BoardDesign } from './pages/board-design/board-design';
import { StatsPreferences } from './pages/stats-preferences/stats-preferences';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'wrapped', component: Wrapped, canActivate: [wrappedFeatureGuard, authGuard] },
  { path: 'assistant', component: Assistant, canActivate: [authGuard] },
  { path: 'board-design', component: BoardDesign, canActivate: [authGuard] },
  { path: 'stats-preferences', component: StatsPreferences, canActivate: [wrappedFeatureGuard, authGuard] },
  { path: '**', redirectTo: '' },
];
