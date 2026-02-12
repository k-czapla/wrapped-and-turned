import { Component, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardDesignService, USER_BOARD_DESIGN_ID } from '../../services/board-design.service';
import { CANVA_REFERENCE_DESIGN_ID } from '../../services/project-board-designs';
import { BoardDesignCard } from '../../components/board-design-card/board-design-card';
import { BoardDesignCustomizer } from '../../components/board-design-customizer/board-design-customizer';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-board-design',
  imports: [RouterLink, BoardDesignCard, BoardDesignCustomizer, Modal],
  templateUrl: './board-design.html',
  styleUrl: './board-design.css',
})
/** Path to optional Canva reference PNG (Option B PoC). Place file in frontend/public/. */
export const CANVA_REFERENCE_IMAGE_PATH = '/canva-reference-board.png';

export class BoardDesign {
  protected boardDesign = inject(BoardDesignService);
  protected designList = this.boardDesign.designList;
  protected selectedDesignId = this.boardDesign.selectedDesignId;
  protected isCustomizerModalOpen = signal(false);
  protected canvaReferenceDesignId = CANVA_REFERENCE_DESIGN_ID;
  protected canvaReferenceImagePath = CANVA_REFERENCE_IMAGE_PATH;
  protected canvaReferenceImageError = signal(false);

  constructor() {
    effect(() => {
      if (this.selectedDesignId() === this.canvaReferenceDesignId) {
        this.canvaReferenceImageError.set(false);
      }
    });
  }

  selectDesign(id: string) {
    this.boardDesign.setSelectedDesignId(id);
    this.isCustomizerModalOpen.set(id === USER_BOARD_DESIGN_ID);
  }

  closeCustomizerModal() {
    this.isCustomizerModalOpen.set(false);
  }
}
