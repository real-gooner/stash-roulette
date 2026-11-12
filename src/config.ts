export const MEDIA_RE = /\.(jpe?g|png|gif|webp|mp4|mov|m4v|webm)$/i;
export const IMG_RE = /\.(jpe?g|png|gif|webp)$/i;
export const VID_RE = /\.(mp4|mov|m4v|webm)$/i;

export const CHUNK = 60; // tiles rendered per page
export const THUMB_CAP = 120; // LRU cap for cached thumbnail URLs
export const MAX_THUMB = 3; // max simultaneous thumbnail decodes
export const QUEUE_MAX = 4; // max files per multi-attach
export const THUMB_PX = 320;

export const HOST_ID = 'stash-roulette-root';
export const IDB_NAME = 'stash-roulette-db';
export const PREFS_KEY = 'prefs';
export const LEGACY_IDB_NAME = 'xrmp-db';
export const LEGACY_PREFS_KEY = 'xrmp-prefs';

export type Site = 'x' | 'discord';

declare const __DEV__: boolean;
declare const __DEMO__: boolean;

export function siteForHost(hostname: string): Site | null {
  if (typeof __DEMO__ !== 'undefined' && __DEMO__) return 'x'; // demo bundle: runs on the demo page
  if (typeof __DEV__ !== 'undefined' && __DEV__ && hostname === 'localhost') return 'x'; // dev bundle only
  if (hostname === 'x.com' || hostname.endsWith('.x.com') || hostname === 'twitter.com' || hostname.endsWith('.twitter.com')) return 'x';
  if (hostname === 'discord.com' || hostname.endsWith('.discord.com')) return 'discord';
  return null;
}

/** Hosts allowed to exchange attach messages with us (bridge allowlist). */
export function isTrustedOrigin(origin: string): boolean {
  try {
    return siteForHost(new URL(origin).hostname) !== null && new URL(origin).protocol === 'https:';
  } catch {
    return false;
  }
}
