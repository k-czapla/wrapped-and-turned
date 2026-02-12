import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardDesignService, USER_BOARD_DESIGN_ID } from '../../services/board-design.service';
import { BoardDesignCard } from '../../components/board-design-card/board-design-card';
import { BoardDesignCustomizer } from '../../components/board-design-customizer/board-design-customizer';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-board-design',
  imports: [RouterLink, BoardDesignCard, BoardDesignCustomizer, Modal],
  templateUrl: './board-design.html',
  styleUrl: './board-design.css',
})
export class BoardDesign {
  protected boardDesign = inject(BoardDesignService);
  protected designList = this.boardDesign.designList;
  protected selectedDesignId = this.boardDesign.selectedDesignId;
  protected isCustomizerModalOpen = signal(false);

  selectDesign(id: string) {
    this.boardDesign.setSelectedDesignId(id);
    this.isCustomizerModalOpen.set(id === USER_BOARD_DESIGN_ID);
  }

  closeCustomizerModal() {
    this.isCustomizerModalOpen.set(false);
  }
}
