import { Component } from '@angular/core';
import { PageShell } from './components/page-shell/page-shell';

@Component({
  selector: 'app-root',
  imports: [PageShell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
