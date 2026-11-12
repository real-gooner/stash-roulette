import type { Meta } from '../types';
import { idbGet, idbSet } from './idb';

/** Cache key includes the folder name; a collision only costs a re-index. */
export const metaKey = (folder: string): string => 'meta:' + folder;

export async function loadMeta(folder: string): Promise<Map<string, Meta>> {
  try {
    const obj = await idbGet<Record<string, Meta>>(metaKey(folder));
    if (obj && typeof obj === 'object') return new Map(Object.entries(obj));
  } catch {
    /* ignore */
  }
  return new Map();
}

let timer: ReturnType<typeof setTimeout> | null = null;
export function saveMetaSoon(folder: string, meta: ReadonlyMap<string, Meta>): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    idbSet(metaKey(folder), Object.fromEntries(meta)).catch(() => undefined);
  }, 1500);
}
