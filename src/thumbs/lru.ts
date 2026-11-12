export interface ThumbEntry { url: string; dur?: number }

/** Thumbnail URL cache with a size cap; evicted blob URLs are revoked. */
export class ThumbCache {
  private map = new Map<string, ThumbEntry>();
  constructor(private cap: number, private revoke: (url: string) => void = u => URL.revokeObjectURL(u)) {}

  get(name: string): ThumbEntry | undefined {
    const v = this.map.get(name);
    if (v) { this.map.delete(name); this.map.set(name, v); } // refresh recency
    return v;
  }
  put(name: string, url: string, dur?: number): void {
    if (!url) return;
    const old = this.map.get(name);
    if (old && old.url !== url) this.revoke(old.url);
    this.map.delete(name);
    this.map.set(name, { url, dur: typeof dur === 'number' && isFinite(dur) ? dur : undefined });
    while (this.map.size > this.cap) {
      const k = this.map.keys().next().value as string;
      const v = this.map.get(k);
      if (v) this.revoke(v.url);
      this.map.delete(k);
    }
  }
  get size(): number { return this.map.size; }
}
