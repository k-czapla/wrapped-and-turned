/**
 * Exchange rates for converting prices to EUR.
 * Uses ECB daily rates when available, with a static fallback for common currencies.
 */

const ECB_DAILY_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Rates: units of foreign currency per 1 EUR (e.g. USD 1.05 => 1 EUR = 1.05 USD). */
let cachedRates: Map<string, number> | null = null;
let cacheTime = 0;

/** Fallback rates (approx, used when ECB fetch fails). Updated periodically. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.05,
  GBP: 0.83,
  CHF: 0.95,
  JPY: 157,
  CAD: 1.43,
  AUD: 1.63,
  SEK: 11.2,
  NOK: 11.5,
  DKK: 7.46,
  PLN: 4.31,
  CZK: 24.5,
  HUF: 395,
};

/**
 * Parse ECB XML for Cube elements with currency and rate attributes.
 * ECB format: <Cube currency="USD" rate="1.0876"/>
 * Rate = units of that currency per 1 EUR.
 */
function parseEcbRates(xml: string): Map<string, number> {
  const rates = new Map<string, number>();
  const re = /<Cube\s+currency=["']([A-Z]{3})["']\s+rate=["']([\d.]+)["']\s*\/?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const code = m[1].toUpperCase();
    const rate = parseFloat(m[2]);
    if (Number.isFinite(rate) && rate > 0) rates.set(code, rate);
  }
  return rates;
}

/**
 * Fetch ECB daily rates and cache them. On failure, use fallback map.
 */
async function getRates(): Promise<Map<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cacheTime < CACHE_TTL_MS) {
    return cachedRates;
  }
  try {
    const { default: axios } = await import('axios');
    const { data } = await axios.get<string>(ECB_DAILY_URL, {
      timeout: 10_000,
      responseType: 'text',
      headers: { Accept: 'application/xml, text/xml' },
    });
    const rates = parseEcbRates(data);
    if (rates.size > 0) {
      cachedRates = rates;
      cacheTime = now;
      return rates;
    }
  } catch {
    // use fallback
  }
  cachedRates = new Map(Object.entries(FALLBACK_RATES));
  cacheTime = now;
  return cachedRates;
}

const EUR_CODES = new Set(['EUR', '€']);

/**
 * Convert an amount from the given currency to EUR.
 * If currency is already EUR (or missing), returns the amount unchanged.
 * Returns null if conversion is not possible (unknown currency).
 */
export async function convertToEur(
  amount: number,
  currency: string | undefined
): Promise<number | null> {
  if (amount == null || !Number.isFinite(amount)) return null;
  const code = (currency ?? '').trim().toUpperCase();
  if (!code || EUR_CODES.has(code)) return amount;
  const rates = await getRates();
  const ratePerEur = rates.get(code);
  if (ratePerEur == null || !Number.isFinite(ratePerEur) || ratePerEur <= 0) return null;
  return amount / ratePerEur;
}

/**
 * Normalize a pattern card's price to EUR in place.
 * If card has price and currency and currency is not EUR, converts price and sets currency to 'EUR'.
 */
export async function normalizeCardPriceToEur(
  card: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const price = card.price;
  const currency = typeof card.currency === 'string' ? card.currency.trim() : undefined;
  if (price == null || !Number.isFinite(price)) return card;
  const code = (currency ?? '').toUpperCase();
  if (code === 'EUR' || code === '') {
    if (!currency) card.currency = 'EUR';
    return card;
  }
  const eurAmount = await convertToEur(price as number, currency);
  if (eurAmount == null) return card;
  card.price = Math.round(eurAmount * 100) / 100;
  card.currency = 'EUR';
  return card;
}
