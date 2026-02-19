import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Me } from '../../services/api';
import { FeatureFlags } from '../../services/feature-flags';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.css',
})
export class HomeHero {
  private featureFlags = inject(FeatureFlags);
  me = input<Me | null | undefined>(undefined);

  login = output<void>();
  protected wrappedEnabled = () => this.featureFlags.wrappedEnabled();
}
