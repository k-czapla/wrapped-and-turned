import { Component, input, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
})
export class Modal {
  isOpen = input.required<boolean>();
  closeModal = output<void>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  onBackdropClick(event: MouseEvent) {
    // Only close if clicking the backdrop itself, not its children
    if (event.target === event.currentTarget) {
      this.closeModal.emit();
    }
  }

  onCloseClick() {
    this.closeModal.emit();
  }

  onEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isOpen()) {
      this.closeModal.emit();
    }
  }
}
