import { AsyncPipe, NgIf } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { Observable } from 'rxjs';
import type { Me } from '../../services/api';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  me$ = input.required<Observable<Me | null | undefined>>();
  login = output<void>();
  logout = output<void>();
}
