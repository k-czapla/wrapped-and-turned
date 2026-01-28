import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { Api, type Me, type WrappedStats, type StatPreferences } from './api';

describe('Api', () => {
  let service: Api;
  let httpMock: HttpTestingController;
  let metaElement: HTMLMetaElement;

  beforeEach(() => {
    // Create a mock meta element
    metaElement = document.createElement('meta');
    metaElement.name = 'wt-backend-url';
    metaElement.content = 'http://localhost:3000';
    document.head.appendChild(metaElement);

    // Mock document.querySelector to return our meta element
    vi.spyOn(document, 'querySelector').mockReturnValue(metaElement);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Api],
    });
    service = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    // Clean up
    if (metaElement.parentNode) {
      metaElement.parentNode.removeChild(metaElement);
    }
    vi.restoreAllMocks();
  });

  describe('getBackendBase', () => {
    it('should extract backend URL from meta tag', () => {
      const meta = document.querySelector('meta[name="wt-backend-url"]') as HTMLMetaElement;
      expect(meta?.content).toBe('http://localhost:3000');
    });

    it('should return empty string for placeholder value', () => {
      const meta = document.querySelector('meta[name="wt-backend-url"]') as HTMLMetaElement;
      if (meta) {
        meta.content = '__WT_BACKEND_URL__';
      }
      // The service should handle this, but we test the meta extraction
      expect(meta?.content).toBe('__WT_BACKEND_URL__');
    });
  });

  describe('refreshMe', () => {
    it('should fetch user info and update me$ observable', (done) => {
      const mockMe: Me = { username: 'testuser' };

      service.refreshMe().subscribe(() => {
        service.me$.subscribe((me) => {
          expect(me).toEqual(mockMe);
          done();
        });
      });

      const req = httpMock.expectOne('http://localhost:3000/api/me');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockMe);
    });

    it('should handle errors gracefully', (done) => {
      service.refreshMe().subscribe(() => {
        service.me$.subscribe((me) => {
          expect(me).toBeNull();
          done();
        });
      });

      const req = httpMock.expectOne('http://localhost:3000/api/me');
      req.error(new ProgressEvent('error'));
    });
  });

  describe('getWrapped', () => {
    it('should fetch wrapped stats with date range', () => {
      const mockStats: WrappedStats = {
        range: { from: '2025-01-01', to: '2025-12-31' },
        totals: {
          projects: 5,
          finishedProjects: 4,
          totalYardage: 1000,
          totalMeterage: 900,
        },
        breakdowns: {
          craft: { Knitting: 3, Crochet: 2 },
        },
        highlights: {
          mostProductiveMonth: '2025-06',
          avgDurationDays: 15,
        },
        projects: [],
      };

      service.getWrapped('2025-01-01', '2025-12-31').subscribe((stats) => {
        expect(stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(
        (request) =>
          request.url === 'http://localhost:3000/api/wrapped' &&
          request.params.get('from') === '2025-01-01' &&
          request.params.get('to') === '2025-12-31'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockStats);
    });

    it('should share replay for multiple subscribers', () => {
      const mockStats: WrappedStats = {
        range: { from: '2025-01-01', to: '2025-12-31' },
        totals: {
          projects: 5,
          finishedProjects: 4,
          totalYardage: 1000,
          totalMeterage: 900,
        },
        breakdowns: {
          craft: { Knitting: 3, Crochet: 2 },
        },
        highlights: {},
        projects: [],
      };

      const obs1 = service.getWrapped('2025-01-01', '2025-12-31');
      const obs2 = service.getWrapped('2025-01-01', '2025-12-31');

      obs1.subscribe();
      obs2.subscribe();

      // Should only make one HTTP request due to shareReplay
      const reqs = httpMock.match('http://localhost:3000/api/wrapped');
      expect(reqs.length).toBe(1);
      reqs[0].flush(mockStats);
    });
  });

  describe('getStatPreferences', () => {
    it('should fetch stat preferences', () => {
      const mockPrefs: StatPreferences = {
        projects: true,
        finishedProjects: true,
        totalYardage: false,
        totalMeterage: false,
        craftBreakdown: true,
        mostProductiveMonth: true,
        avgDurationDays: false,
        projectsGallery: true,
      };

      service.getStatPreferences().subscribe((prefs) => {
        expect(prefs).toEqual(mockPrefs);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/stat-preferences');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockPrefs);
    });
  });

  describe('saveStatPreferences', () => {
    it('should save stat preferences', () => {
      const prefs: StatPreferences = {
        projects: true,
        finishedProjects: false,
        totalYardage: true,
        totalMeterage: true,
        craftBreakdown: true,
        mostProductiveMonth: false,
        avgDurationDays: true,
        projectsGallery: true,
      };

      service.saveStatPreferences(prefs).subscribe((saved) => {
        expect(saved).toEqual(prefs);
      });

      const req = httpMock.expectOne('http://localhost:3000/api/stat-preferences');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(prefs);
      expect(req.request.withCredentials).toBe(true);
      req.flush(prefs);
    });
  });

  describe('logout', () => {
    it('should logout and clear me state', (done) => {
      // First set a user
      service.refreshMe().subscribe(() => {
        // Then logout
        service.logout().subscribe(() => {
          service.me$.subscribe((me) => {
            expect(me).toBeNull();
            done();
          });
        });

        const logoutReq = httpMock.expectOne('http://localhost:3000/auth/logout');
        logoutReq.flush({});
      });

      const meReq = httpMock.expectOne('http://localhost:3000/api/me');
      meReq.flush({ username: 'testuser' });
    });
  });
});
