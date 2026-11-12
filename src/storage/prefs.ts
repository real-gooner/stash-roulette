import { LEGACY_PREFS_KEY, PREFS_KEY } from '../config';

export interface Prefs {
  shuffled?: boolean;
  shuffleOrder?: string[];
  panel?: { w?: number; h?: number; pos?: { l: number; t: number } };
  btn?: { pos: { l: number; t: number } };
  resizeTipSeen?: boolean;
  recent?: string[];
}

declare function GM_getValue<T>(key: string, def?: T): T;
declare function GM_setValue(key: string, val: unknown): void;

const hasGM = typeof GM_getValue === 'function' && typeof GM_setValue === 'function';

/** Prefs live in the userscript manager's storage, not in the site's localStorage. */
export function loadPrefs(): Prefs {
  try {
    if (hasGM) {
      const v = GM_getValue<Prefs | undefined>(PREFS_KEY);
      if (v && typeof v === 'object') return v;
      return migrateLegacy();
    }
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}

export function savePrefs(p: Prefs): void {
  try {
    if (hasGM) GM_setValue(PREFS_KEY, p);
    else localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* storage unavailable: prefs just won't persist */
  }
}

/** One-time import of prefs written by the old "X Random Media Picker" script. */
function migrateLegacy(): Prefs {
  try {
    const raw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return {};
    const old = JSON.parse(raw) as Prefs;
    savePrefs(old);
    return old;
  } catch {
    return {};
  }
}
