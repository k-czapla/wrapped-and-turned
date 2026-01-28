import { Component } from '@angular/core';
import { HomeFeatureCard } from '../home-feature-card/home-feature-card';

@Component({
  selector: 'app-home-features',
  imports: [HomeFeatureCard],
  templateUrl: './home-features.html',
  styleUrl: './home-features.css',
})
export class HomeFeatures { }
