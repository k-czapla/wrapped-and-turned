import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Api } from '../../services/api';
import { HomeHero } from '../../components/home-hero/home-hero';
import { HomeFeatures } from '../../components/home-features/home-features';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe, HomeHero, HomeFeatures],
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
