import { Component, inject } from '@angular/core';
import { HomeFeatureCard } from '../home-feature-card/home-feature-card';
import { FeatureFlags } from '../../services/feature-flags';

@Component({
  selector: 'app-home-features',
  imports: [HomeFeatureCard],
  templateUrl: './home-features.html',
  styleUrl: './home-features.css',
})
export class HomeFeatures {
  private featureFlags = inject(FeatureFlags);
  protected wrappedEnabled = () => this.featureFlags.wrappedEnabled();
}
