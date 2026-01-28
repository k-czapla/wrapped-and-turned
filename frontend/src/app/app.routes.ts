import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Wrapped } from './pages/wrapped/wrapped';
import { Assistant } from './pages/assistant/assistant';

export const routes: Routes = [
  { path: '', component: Home, pathMatch: 'full' },
  { path: 'wrapped', component: Wrapped },
  { path: 'assistant', component: Assistant },
  { path: '**', redirectTo: '' },
];
