import { describe, it, expect, beforeEach, vi } from 'vitest';
import { convertToEur, normalizeCardPriceToEur } from './exchange-rates.js';

describe('exchange-rates', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe('convertToEur', () => {
    it('returns amount unchanged when currency is EUR', async () => {
      expect(await convertToEur(9.6, 'EUR')).toBe(9.6);
      expect(await convertToEur(9.6, 'eur')).toBe(9.6);
    });

    it('returns amount unchanged when currency is missing or empty', async () => {
      expect(await convertToEur(5, undefined)).toBe(5);
      expect(await convertToEur(5, '')).toBe(5);
    });

    it('converts USD to EUR (uses ECB or fallback)', async () => {
      const result = await convertToEur(10.5, 'USD');
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(10.5);
      expect(typeof result).toBe('number');
    });

    it('returns null for invalid amount', async () => {
      expect(await convertToEur(NaN, 'USD')).toBeNull();
      expect(await convertToEur(Infinity, 'USD')).toBeNull();
    });

    it('returns null for unknown currency', async () => {
      expect(await convertToEur(10, 'XXX')).toBeNull();
    });
  });

  describe('normalizeCardPriceToEur', () => {
    it('leaves card unchanged when price is already in EUR', async () => {
      const card = { id: 1, price: 9.6, currency: 'EUR' };
      const out = await normalizeCardPriceToEur({ ...card });
      expect(out.price).toBe(9.6);
      expect(out.currency).toBe('EUR');
    });

    it('converts non-EUR price to EUR and sets currency to EUR', async () => {
      const card = { id: 1, price: 6.5, currency: 'USD' };
      const out = await normalizeCardPriceToEur({ ...card });
      expect(out.currency).toBe('EUR');
      expect(typeof out.price).toBe('number');
      expect((out.price as number)).toBeGreaterThan(0);
      expect((out.price as number)).toBeLessThan(6.5);
    });

    it('sets currency to EUR when price present but currency missing', async () => {
      const card = { id: 1, price: 9.6 };
      const out = await normalizeCardPriceToEur({ ...card });
      expect(out.price).toBe(9.6);
      expect(out.currency).toBe('EUR');
    });

    it('leaves card unchanged when no price', async () => {
      const card = { id: 1, currency: 'USD' };
      const out = await normalizeCardPriceToEur({ ...card });
      expect(out).toEqual(card);
    });
  });
});
