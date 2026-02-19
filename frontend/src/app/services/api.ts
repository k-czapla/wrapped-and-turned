import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, shareReplay, tap } from 'rxjs';

export type Me = { username: string };

/** Stat keys that can be toggled for analysis. Matches backend STAT_PREFERENCE_KEYS. */
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

export type StatPreferences = Record<StatPreferenceKey, boolean>;

export type WrappedStats = {
  range: { from: string; to: string };
  totals: {
    projects: number;
    finishedProjects: number;
    totalYardage: number;
    totalMeterage: number;
  };
  breakdowns: {
    craft: Record<string, number>;
  };
  highlights: {
    mostProductiveMonth?: string;
    avgDurationDays?: number;
  };
  projects: Array<{
    id: number;
    name: string;
    completed?: string;
    started?: string;
    craft?: string;
    yardage?: number;
    meterage?: number;
    patternName?: string;
    designerName?: string;
    imageUrl?: string;
    url?: string;
  }>;
};

export type ProjectCard = {
  id: number;
  imageUrl?: string;
  /** Project photos (medium preferred). Used when photo source is "project". */
  projectPhotos?: string[];
  /** Pattern photos (medium preferred). Used when photo source is "pattern". */
  patternPhotos?: string[];
  projectName: string;
  patternName?: string;
  designerName?: string;
  sizeMade?: string;
  yarnUsed?: string;
  /** Ravelry project page URL for QR code / link */
  projectUrl?: string;
  /** ISO-ish date when project was started */
  started?: string;
  /** ISO-ish date when project was completed */
  completed?: string;
};

/** Result of Generate Description (YouTube/show notes). */
export type GenerateDescriptionResult = {
  title: string;
  description: string;
  ravelryLinks: string;
  hashtags: string;
};

/** Options for what to show on the Podcaster's Assistant board (Ravelry-backed fields). */
export type BoardDisplayOptions = {
  showPhoto: boolean;
  /** When showPhoto is true: use project's photos or pattern's photos. */
  photoSource: 'project' | 'pattern';
  showPatternName: boolean;
  showDesignerName: boolean;
  showYarnUsed: boolean;
  showSizeMade: boolean;
  showStartDate: boolean;
  showCompletedDate: boolean;
};

export const DEFAULT_BOARD_DISPLAY_OPTIONS: BoardDisplayOptions = {
  showPhoto: true,
  photoSource: 'project',
  showPatternName: true,
  showDesignerName: true,
  showYarnUsed: true,
  showSizeMade: true,
  showStartDate: true,
  showCompletedDate: true,
};

@Injectable({
  providedIn: 'root',
})
export class Api {
  private meState = new BehaviorSubject<Me | null | undefined>(undefined);
  readonly me$ = this.meState.asObservable();

  constructor(private http: HttpClient) { }

  private getBackendBase(): string {
    const meta = document.querySelector('meta[name="wt-backend-url"]') as HTMLMetaElement | null;
    const raw = meta?.content?.trim() ?? '';
    if (!raw || raw === '__WT_BACKEND_URL__') return '';
    return raw.replace(/\/+$/, '');
  }

  private join(base: string, path: string): string {
    if (!base) return path;
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  }

  refreshMe() {
    const backendBase = this.getBackendBase();
    return this.http.get<Me>(this.join(backendBase, '/api/me'), { withCredentials: true }).pipe(
      catchError(() => of(null)),
      tap((me) => this.meState.next(me)),
      map(() => void 0)
    );
  }

  loginWithRavelry() {
    const backendBase = this.getBackendBase();
    window.location.assign(this.join(backendBase, '/auth/ravelry/start'));
  }

  logout() {
    const backendBase = this.getBackendBase();
    return this.http.post(this.join(backendBase, '/auth/logout'), {}, { withCredentials: true }).pipe(
      catchError(() => of(null)),
      tap(() => this.meState.next(null)),
      map(() => void 0)
    );
  }

  getWrapped(from: string, to: string) {
    const backendBase = this.getBackendBase();
    return this.http
      .get<WrappedStats>(this.join(backendBase, '/api/wrapped'), {
        withCredentials: true,
        params: { from, to },
      })
      .pipe(shareReplay(1));
  }

  getProjectCard(projectId: number) {
    const backendBase = this.getBackendBase();
    return this.http
      .get<ProjectCard>(this.join(backendBase, `/api/project-card/${projectId}`), {
        withCredentials: true,
      })
      .pipe(shareReplay(1));
  }

  /**
   * Generate YouTube/show-notes description for selected projects.
   * Sends card summaries (from existing ProjectCard[]) and optional prompt; returns title, description, Ravelry links, hashtags.
   * @param foCount - Optional count of selected projects that are finished objects (completed in range). Used for title "X FOs". If omitted, backend uses cards.length.
   */
  generateDescription(cards: ProjectCard[], optionalPrompt?: string, foCount?: number) {
    const backendBase = this.getBackendBase();
    const body: Record<string, unknown> = {
      cards: cards.map((c) => ({
        projectName: c.projectName,
        patternName: c.patternName,
        designerName: c.designerName,
        projectUrl: c.projectUrl,
      })),
      ...(optionalPrompt?.trim() && { optionalPrompt: optionalPrompt.trim() }),
    };
    if (typeof foCount === 'number' && Number.isInteger(foCount) && foCount >= 0) {
      body['foCount'] = foCount;
    }
    return this.http.post<GenerateDescriptionResult>(
      this.join(backendBase, '/api/generate-description'),
      body,
      { withCredentials: true }
    );
  }

  getStatPreferences() {
    const backendBase = this.getBackendBase();
    return this.http.get<StatPreferences>(this.join(backendBase, '/api/stat-preferences'), {
      withCredentials: true,
    });
  }

  saveStatPreferences(prefs: StatPreferences) {
    const backendBase = this.getBackendBase();
    return this.http.put<StatPreferences>(this.join(backendBase, '/api/stat-preferences'), prefs, {
      withCredentials: true,
    });
  }

  /**
   * Proxies an image URL through the backend to avoid CORS issues.
   * Returns a data URL that can be used in canvas operations.
   */
  async proxyImageToDataUrl(imageUrl: string): Promise<string> {
    const backendBase = this.getBackendBase();
    const proxyUrl = this.join(backendBase, `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);

    const response = await fetch(proxyUrl, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to proxy image: ${response.statusText}`);
    }

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
