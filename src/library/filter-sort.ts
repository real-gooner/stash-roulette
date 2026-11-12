import { IMG_RE, VID_RE } from '../config';
import type { Filters, MediaItem, Meta } from '../types';

export const defaultFilters = (isDiscord: boolean): Filters => ({
  query: '',
  type: 'all',
  dur: 'all',
  maxMb: isDiscord ? '10' : 'all',
  sort: 'name',
});

export const byName = (a: { name: string }, b: { name: string }): number =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

export function hasActiveFilters(f: Filters, isDiscord: boolean): boolean {
  const d = defaultFilters(isDiscord);
  return !!f.query.trim() || f.type !== d.type || f.dur !== d.dur || f.maxMb !== d.maxMb;
}

function durationOk(dur: number, f: Filters['dur']): boolean {
  if (f === 'short') return dur < 15;
  if (f === 'med') return dur >= 15 && dur < 60;
  if (f === 'long') return dur >= 60 && dur < 300;
  if (f === 'xl') return dur >= 300;
  return true;
}

/**
 * Filter then sort. Unknown metadata never hides a file: size and duration are
 * measured lazily, so a file stays visible until we know it does not match.
 */
export function applyFilters(
  files: readonly MediaItem[],
  f: Filters,
  meta: ReadonlyMap<string, Meta>,
  shuffled: boolean,
): MediaItem[] {
  let list = files.slice();
  const q = f.query.trim().toLowerCase();
  if (q) list = list.filter(x => x.name.toLowerCase().includes(q));
  if (f.type !== 'all') list = list.filter(x => (f.type === 'vid' ? VID_RE.test(x.name) : IMG_RE.test(x.name)));
  if (f.dur !== 'all' || f.maxMb !== 'all') {
    const maxBytes = f.maxMb === 'all' ? Infinity : parseFloat(f.maxMb) * 1048576;
    list = list.filter(x => {
      const m = meta.get(x.name);
      if (f.dur !== 'all') {
        if (!VID_RE.test(x.name)) return false;
        if (m && typeof m.dur === 'number' && !durationOk(m.dur, f.dur)) return false;
      }
      if (m && typeof m.size === 'number' && m.size > maxBytes) return false;
      return true;
    });
  }
  if (!shuffled && f.sort !== 'name') {
    const key = (x: MediaItem): number => {
      const m = meta.get(x.name) ?? {};
      return f.sort === 'date' ? m.mtime ?? 0 : f.sort === 'size' ? m.size ?? 0 : m.dur ?? 0;
    };
    list.sort((a, b) => key(b) - key(a));
  }
  return list;
}

/** Order files by a saved shuffle (unknown names go last), or by name. */
export function orderFiles(list: readonly MediaItem[], shuffled: boolean, saved: readonly string[] = []): MediaItem[] {
  const out = list.slice();
  if (!shuffled) return out.sort(byName);
  const pos = new Map(saved.map((n, i) => [n, i]));
  return out.sort((a, b) => (pos.get(a.name) ?? Infinity) - (pos.get(b.name) ?? Infinity) || byName(a, b));
}

export function shuffleArray<T>(a: readonly T[], rng: () => number = Math.random): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}

/** Random pick that avoids the previous pick and recently used names when possible. */
export function pickRandom(list: readonly MediaItem[], recent: readonly string[], rng: () => number = Math.random): MediaItem | null {
  if (!list.length) return null;
  const recentSet = new Set(recent);
  const fresh = list.filter(x => !recentSet.has(x.name));
  const pool = fresh.length ? fresh : list.length > 1 ? list.filter(x => x.name !== recent[recent.length - 1]) : list;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}
