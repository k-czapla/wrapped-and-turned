import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-board-background-upload',
  standalone: true,
  templateUrl: './board-background-upload.html',
  styleUrl: './board-background-upload.css',
})
export class BoardBackgroundUpload {
  /** Current background image data URL, if any. */
  dataUrl = input<string | undefined>(undefined);

  /** Emitted when user uploads an image (data URL) or removes it (undefined). */
  dataUrlChange = output<string | undefined>();

  protected onFileSelected(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        this.dataUrlChange.emit(result);
      }
      inputEl.value = '';
    };
    reader.onerror = () => {
      inputEl.value = '';
    };
    reader.readAsDataURL(file);
  }

  protected remove() {
    this.dataUrlChange.emit(undefined);
  }

  protected triggerFileInput(inputEl: HTMLInputElement) {
    inputEl.click();
  }
}
