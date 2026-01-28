import { Component, input } from '@angular/core';

@Component({
  selector: 'app-home-feature-card',
  standalone: true,
  templateUrl: './home-feature-card.html',
  styleUrl: './home-feature-card.css',
})
export class HomeFeatureCard {
  title = input.required<string>();
  description = input.required<string>();
}
