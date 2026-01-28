import { Injectable, signal, computed } from '@angular/core';
import {
  PROJECT_BOARD_DESIGNS,
  DEFAULT_BOARD_DESIGN_ID,
  getProjectBoardDesignById,
  type ProjectBoardDesign,
} from './project-board-designs';

const STORAGE_KEY = 'wrapped-and-turned-board-design';

@Injectable({ providedIn: 'root' })
export class BoardDesignService {
  private selectedId = signal<string | null>(this.readStoredId());

  readonly designs = PROJECT_BOARD_DESIGNS;

  readonly selectedDesignId = computed(() => this.selectedId() ?? DEFAULT_BOARD_DESIGN_ID);

  readonly selectedDesign = computed<ProjectBoardDesign>(() => {
    const id = this.selectedDesignId();
    return getProjectBoardDesignById(id) ?? PROJECT_BOARD_DESIGNS[0];
  });

  setSelectedDesignId(id: string) {
    const design = getProjectBoardDesignById(id);
    if (design) {
      this.selectedId.set(id);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore storage errors
      }
    }
  }

  private readStoredId(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && getProjectBoardDesignById(stored)) return stored;
    } catch {
      // ignore
    }
    return null;
  }
}
