import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, of, shareReplay, tap } from 'rxjs';

export type Me = { username: string };

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
  projectName: string;
  patternName?: string;
  designerName?: string;
  sizeMade?: string;
  yarnUsed?: string;
};

@Injectable({
  providedIn: 'root',
})
export class Api {
  private meState = new BehaviorSubject<Me | null | undefined>(undefined);
  readonly me$ = this.meState.asObservable();

  constructor(private http: HttpClient) {}

  refreshMe() {
    return this.http.get<Me>('/api/me').pipe(
      catchError(() => of(null)),
      tap((me) => this.meState.next(me)),
      map(() => void 0)
    );
  }

  loginWithRavelry() {
    window.location.href = '/auth/ravelry/start';
  }

  logout() {
    return this.http.post('/auth/logout', {}).pipe(
      catchError(() => of(null)),
      tap(() => this.meState.next(null)),
      map(() => void 0)
    );
  }

  getWrapped(from: string, to: string) {
    return this.http
      .get<WrappedStats>('/api/wrapped', {
        params: { from, to },
      })
      .pipe(shareReplay(1));
  }

  getProjectCard(projectId: number) {
    return this.http.get<ProjectCard>(`/api/project-card/${projectId}`).pipe(shareReplay(1));
  }
}
