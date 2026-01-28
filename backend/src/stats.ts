import type { RavelryProjectListItem } from './ravelryApi.js';

export type WrappedStats = {
  range: { from: string; to: string };
  totals: {
    projects: number;
    finishedProjects: number;
    totalYardage: number;
    totalMeterage: number;
  };
  breakdowns: {
    craft: Record<string, number>;
  };
  highlights: {
    mostProductiveMonth?: string;
    avgDurationDays?: number;
  };
  projects: Array<{
    id: number;
    name: string;
    completed?: string;
    started?: string;
    craft?: string;
    yardage?: number;
    meterage?: number;
    patternName?: string;
    designerName?: string;
    imageUrl?: string;
    url?: string;
  }>;
};

export function safeDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function withinRange(date: Date, from: Date, to: Date): boolean {
  return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
}

export function inc(map: Record<string, number>, key: string, by = 1) {
  map[key] = (map[key] ?? 0) + by;
}

export function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function computeBaseStats(args: {
  from: string;
  to: string;
  items: RavelryProjectListItem[];
}) {
  const fromD = new Date(args.from);
  const toD = new Date(args.to);

  const inRange = args.items.filter((p) => {
    const completed = safeDate(p.completed);
    if (completed) return withinRange(completed, fromD, toD);
    const started = safeDate(p.started);
    return started ? withinRange(started, fromD, toD) : false;
  });

  const craft: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const p of inRange) {
    inc(craft, p.craft_name ?? 'Unknown');
    const d = safeDate(p.completed) ?? safeDate(p.started);
    if (d) inc(byMonth, monthKey(d));
  }

  const mostProductiveMonth = Object.entries(byMonth).sort((a, b) => b[1] - a[1])[0]?.[0];

  return {
    inRange,
    craft,
    mostProductiveMonth,
  };
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx]);
    }
  });

  await Promise.all(workers);
  return results;
}
