import { Component, OnInit } from '@angular/core';
import { Api, STAT_PREFERENCE_KEYS, type StatPreferences } from '../../services/api';
import { StatPreferencesForm } from '../../components/stat-preferences-form/stat-preferences-form';
import { ErrorAlert } from '../../components/error-alert/error-alert';

function defaultStatPreferences(): StatPreferences {
  const out = {} as StatPreferences;
  for (const k of STAT_PREFERENCE_KEYS) {
    out[k] = true;
  }
  return out;
}

@Component({
  selector: 'app-stats-preferences',
  imports: [StatPreferencesForm, ErrorAlert],
  templateUrl: './stats-preferences.html',
  styleUrl: './stats-preferences.css',
})
export class StatsPreferences implements OnInit {
  protected prefs: StatPreferences = defaultStatPreferences();
  protected loading = true;
  protected saving = false;
  protected error: string | null = null;

  constructor(private api: Api) {}

  ngOnInit() {
    this.api.getStatPreferences().subscribe({
      next: (p) => {
        this.prefs = { ...defaultStatPreferences(), ...p };
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? e?.status === 401
          ? 'Please log in to view and change your stat preferences.'
          : 'Failed to load preferences.';
      },
    });
  }

  onPreferenceChange(next: StatPreferences) {
    this.prefs = next;
    this.error = null;
    this.saving = true;
    this.api.saveStatPreferences(next).subscribe({
      next: () => {
        this.saving = false;
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.error ?? 'Failed to save preferences.';
      },
    });
  }
}
