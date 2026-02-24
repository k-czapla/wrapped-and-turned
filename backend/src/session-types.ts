/** Stat keys that can be toggled for analysis. Default: all true. */
export const STAT_PREFERENCE_KEYS = [
  'projects',
  'finishedProjects',
  'totalYardage',
  'totalMeterage',
  'craftBreakdown',
  'mostProductiveMonth',
  'avgDurationDays',
  'projectsGallery',
] as const;

export type StatPreferenceKey = (typeof STAT_PREFERENCE_KEYS)[number];

export type StatPreferences = Partial<Record<StatPreferenceKey, boolean>>;

declare module 'express-session' {
  interface SessionData {
    ravelry?: {
      username?: string;
      accessToken: string;
      refreshToken?: string;
      expiresAt: number;
    };
    oauthState?: string;
    /** Which Ravelry stats the user wants to be analyzed (shown). Default: all true. */
    statPreferences?: StatPreferences;
  }
}
