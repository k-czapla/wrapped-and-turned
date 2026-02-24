import { Pipe, PipeTransform } from '@angular/core';

const ELLIPSIS = ' … ';

/**
 * Truncates long text by showing the beginning and end with " … " in the middle.
 * Approximates ~2 lines of text when used with default maxLength (e.g. in field-value).
 */
@Pipe({
  name: 'truncateMiddle',
  standalone: true,
})
export class TruncateMiddlePipe implements PipeTransform {
  transform(value: string | null | undefined, maxLength: number = 80): string {
    if (value == null || typeof value !== 'string') return '';
    const str = value.trim();
    if (str.length <= maxLength) return str;
    const take = Math.max(0, Math.floor((maxLength - ELLIPSIS.length) / 2));
    const start = str.slice(0, take);
    const end = str.slice(-take);
    return start + ELLIPSIS + end;
  }
}
