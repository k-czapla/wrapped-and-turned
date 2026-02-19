import { AsyncPipe, NgIf } from '@angular/common';
import { Component, HostListener, inject, input, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { Observable } from 'rxjs';
import type { Me } from '../../services/api';
import { FeatureFlags } from '../../services/feature-flags';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  private featureFlags = inject(FeatureFlags);
  me$ = input.required<Observable<Me | null | undefined>>();
  login = output<void>();
  logout = output<void>();

  protected showUserMenu = signal(false);
  protected wrappedEnabled = () => this.featureFlags.wrappedEnabled();

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
