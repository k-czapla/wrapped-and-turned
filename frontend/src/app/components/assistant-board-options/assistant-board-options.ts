import { Component, input, output } from '@angular/core';
import type { BoardDisplayOptions } from '../../services/api';

@Component({
  selector: 'app-assistant-board-options',
  standalone: true,
  templateUrl: './assistant-board-options.html',
  styleUrl: './assistant-board-options.css',
})
export class AssistantBoardOptions {
  options = input.required<BoardDisplayOptions>();
  optionsChange = output<BoardDisplayOptions>();

  protected toggle<K extends keyof BoardDisplayOptions>(key: K) {
    const current = this.options();
    this.optionsChange.emit({ ...current, [key]: !current[key] });
  }
}
