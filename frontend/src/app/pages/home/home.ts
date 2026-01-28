import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../../services/api';

@Component({
  selector: 'app-home',
  imports: [RouterLink, AsyncPipe, NgIf],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private api = inject(Api);
  protected readonly me$ = this.api.me$;

  login() {
    this.api.loginWithRavelry();
  }
}
