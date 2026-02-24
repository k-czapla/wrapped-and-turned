import { Component, input, output } from '@angular/core';
import type { PatternRoundUpDisplayOptions } from '../../services/api';

@Component({
  selector: 'app-assistant-pattern-board-options',
  standalone: true,
  templateUrl: './assistant-pattern-board-options.html',
  styleUrl: './assistant-pattern-board-options.css',
})
export class AssistantPatternBoardOptions {
  options = input.required<PatternRoundUpDisplayOptions>();
  optionsChange = output<PatternRoundUpDisplayOptions>();

  protected toggle<K extends keyof PatternRoundUpDisplayOptions>(key: K) {
    const current = this.options();
    this.optionsChange.emit({ ...current, [key]: !current[key] });
  }
}
