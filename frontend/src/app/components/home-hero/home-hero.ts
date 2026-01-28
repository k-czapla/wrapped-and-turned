import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Me } from '../../services/api';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.css',
})
export class HomeHero {
  me = input<Me | null | undefined>(undefined);

  login = output<void>();
}
