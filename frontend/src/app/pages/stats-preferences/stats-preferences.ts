import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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

  constructor(
    private api: Api,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.api.getStatPreferences().subscribe({
      next: (p) => {
        this.prefs = { ...defaultStatPreferences(), ...p };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.error ?? e?.status === 401
          ? 'Please log in to view and change your stat preferences.'
          : 'Failed to load preferences.';
        this.cdr.detectChanges();
      },
    });
  }

  onPreferenceChange(next: StatPreferences) {
    this.prefs = next;
    this.error = null;
    this.saving = true;
    this.cdr.detectChanges();
    this.api.saveStatPreferences(next).subscribe({
      next: () => {
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.error ?? 'Failed to save preferences.';
        this.cdr.detectChanges();
      },
    });
  }
}
