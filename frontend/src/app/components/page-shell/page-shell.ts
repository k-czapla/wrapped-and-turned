import { AsyncPipe, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Api } from '../../services/api';

@Component({
  selector: 'app-page-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe, NgIf],
  templateUrl: './page-shell.html',
  styleUrl: './page-shell.css',
})
export class PageShell implements OnInit {
  private api = inject(Api);
  protected readonly me$ = this.api.me$;

  ngOnInit(): void {
    this.api.refreshMe().subscribe();
  }

  login() {
    this.api.loginWithRavelry();
  }

  logout() {
    this.api.logout().subscribe();
  }
}
