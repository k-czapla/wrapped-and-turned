import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardDesignService } from '../../services/board-design.service';
import { BoardDesignCard } from '../../components/board-design-card/board-design-card';
import { BoardDesignCustomizer } from '../../components/board-design-customizer/board-design-customizer';

@Component({
  selector: 'app-board-design',
  imports: [RouterLink, BoardDesignCard, BoardDesignCustomizer],
  templateUrl: './board-design.html',
  styleUrl: './board-design.css',
})
export class BoardDesign {
  protected boardDesign = inject(BoardDesignService);
  protected designs = this.boardDesign.designs;
  protected selectedDesignId = this.boardDesign.selectedDesignId;

  selectDesign(id: string) {
    this.boardDesign.setSelectedDesignId(id);
  }
}
