import { AsyncPipe, NgIf } from '@angular/common';
import { Component, HostListener, input, output, signal } from '@angular/core';
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

  protected showUserMenu = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-user-menu]')) {
      this.closeUserMenu();
    }
  }

  toggleUserMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showUserMenu.update((v) => !v);
  }

  closeUserMenu() {
    this.showUserMenu.set(false);
  }
}
