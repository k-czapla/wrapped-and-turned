import { Component, input, output } from '@angular/core';
import {
  STAT_PREFERENCE_KEYS,
  type StatPreferenceKey,
  type StatPreferences,
} from '../../services/api';

const STAT_LABELS: Record<StatPreferenceKey, string> = {
  projects: 'Projects count',
  finishedProjects: 'Finished projects',
  totalYardage: 'Total yardage',
  totalMeterage: 'Total meterage',
  craftBreakdown: 'Craft breakdown (chart)',
  mostProductiveMonth: 'Most productive month',
  avgDurationDays: 'Average duration (days)',
  projectsGallery: 'Projects gallery',
};

@Component({
  selector: 'app-stat-preferences-form',
  standalone: true,
  imports: [],
  templateUrl: './stat-preferences-form.html',
  styleUrl: './stat-preferences-form.css',
})
export class StatPreferencesForm {
  readonly prefs = input.required<StatPreferences>();
  readonly saving = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly preferenceChange = output<StatPreferences>();

  protected readonly keys = STAT_PREFERENCE_KEYS;
  protected readonly labels = STAT_LABELS;

  protected toggle(key: StatPreferenceKey) {
    const current = this.prefs();
    const next: StatPreferences = { ...current, [key]: !current[key] };
    this.preferenceChange.emit(next);
  }
}
