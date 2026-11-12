import { describe, expect, it } from 'vitest';
import { applyFilters, defaultFilters, hasActiveFilters, orderFiles, pickRandom, shuffleArray } from '../src/library/filter-sort';
import type { MediaItem, Meta } from '../src/types';

const item = (name: string): MediaItem => ({ name, handle: {} as FileSystemFileHandle });
const files = ['b.jpg', 'a.mp4', 'c10.png', 'c2.png', 'd.webm'].map(item);
const meta = new Map<string, Meta>([
  ['a.mp4', { size: 2e6, dur: 10, mtime: 5 }],
  ['d.webm', { size: 30e6, dur: 400, mtime: 9 }],
  ['b.jpg', { size: 100, mtime: 1 }],
]);
const f = (over = {}) => ({ ...defaultFilters(false), ...over });

describe('applyFilters', () => {
  it('searches case-insensitively', () => {
    expect(applyFilters(files, f({ query: 'C1' }), meta, false).map(x => x.name)).toEqual(['c10.png']);
  });
  it('filters by type', () => {
    expect(applyFilters(files, f({ type: 'vid' }), meta, false).map(x => x.name)).toEqual(['a.mp4', 'd.webm']);
  });
  it('keeps files with unknown size/duration visible', () => {
    expect(applyFilters(files, f({ maxMb: '5' }), meta, false).map(x => x.name)).not.toContain('d.webm');
    expect(applyFilters(files, f({ maxMb: '5' }), meta, false).map(x => x.name)).toContain('c2.png');
  });
  it('duration filter excludes images and out-of-range videos', () => {
    expect(applyFilters(files, f({ dur: 'short' }), meta, false).map(x => x.name)).toEqual(['a.mp4']);
    expect(applyFilters(files, f({ dur: 'xl' }), meta, false).map(x => x.name)).toEqual(['d.webm']);
  });
  it('sorts by size descending, ignored while shuffled', () => {
    expect(applyFilters(files, f({ sort: 'size' }), meta, false)[0]?.name).toBe('d.webm');
    expect(applyFilters(files, f({ sort: 'size' }), meta, true).map(x => x.name)).toEqual(files.map(x => x.name));
  });
});

describe('ordering', () => {
  it('sorts names naturally', () => {
    expect(orderFiles(files, false).map(x => x.name)).toEqual(['a.mp4', 'b.jpg', 'c2.png', 'c10.png', 'd.webm']);
  });
  it('applies a saved shuffle order, unknown last', () => {
    expect(orderFiles(files, true, ['d.webm', 'b.jpg']).map(x => x.name).slice(0, 2)).toEqual(['d.webm', 'b.jpg']);
  });
  it('shuffle keeps all items', () => {
    expect(shuffleArray([1, 2, 3, 4, 5], () => 0.3).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('pickRandom', () => {
  it('returns null for empty lists', () => expect(pickRandom([], [])).toBeNull());
  it('avoids recent picks', () => {
    for (let i = 0; i < 50; i++) expect(pickRandom(files, ['b.jpg', 'a.mp4', 'c10.png', 'c2.png'])?.name).toBe('d.webm');
  });
  it('never repeats the last pick when everything is recent', () => {
    const all = files.map(x => x.name);
    for (let i = 0; i < 50; i++) expect(pickRandom(files, all)?.name).not.toBe('d.webm');
  });
});

describe('hasActiveFilters', () => {
  it('treats the Discord size default as inactive', () => {
    expect(hasActiveFilters(defaultFilters(true), true)).toBe(false);
    expect(hasActiveFilters(defaultFilters(true), false)).toBe(true);
  });
});
