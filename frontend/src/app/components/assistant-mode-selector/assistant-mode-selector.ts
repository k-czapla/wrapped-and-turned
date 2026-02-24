import { Component, input, output } from '@angular/core';

export type AssistantMode = 'project-update' | 'pattern-round-up';

@Component({
  selector: 'app-assistant-mode-selector',
  standalone: true,
  templateUrl: './assistant-mode-selector.html',
  styleUrl: './assistant-mode-selector.css',
})
export class AssistantModeSelector {
  value = input.required<AssistantMode>();

  valueChange = output<AssistantMode>();

  protected setMode(mode: AssistantMode) {
    this.valueChange.emit(mode);
  }
}
