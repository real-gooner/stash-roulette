import { describe, expect, it } from 'vitest';
import { ThumbCache } from '../src/thumbs/lru';
import { TaskQueue } from '../src/thumbs/queue';

describe('ThumbCache', () => {
  it('evicts oldest and revokes its URL', () => {
    const revoked: string[] = [];
    const c = new ThumbCache(2, u => revoked.push(u));
    c.put('a', 'ua'); c.put('b', 'ub'); c.get('a'); c.put('c', 'uc');
    expect(revoked).toEqual(['ub']);
    expect(c.get('a')?.url).toBe('ua');
    expect(c.size).toBe(2);
  });
  it('revokes a replaced URL', () => {
    const revoked: string[] = [];
    const c = new ThumbCache(5, u => revoked.push(u));
    c.put('a', 'u1'); c.put('a', 'u2');
    expect(revoked).toEqual(['u1']);
  });
});

describe('TaskQueue', () => {
  it('respects the concurrency limit and goes idle once', async () => {
    let running = 0, peak = 0, idle = 0, done = 0;
    const q = new TaskQueue<number>(2, async () => {
      running++; peak = Math.max(peak, running);
      await new Promise(r => setTimeout(r, 5));
      running--; done++;
    }, () => idle++);
    for (let i = 0; i < 6; i++) q.push(i);
    await new Promise(r => setTimeout(r, 100));
    expect(peak).toBe(2); expect(done).toBe(6); expect(idle).toBe(1);
  });
  it('keeps going after a failing task', async () => {
    let done = 0;
    const q = new TaskQueue<number>(1, async n => { if (n === 0) throw new Error('x'); done++; });
    q.push(0); q.push(1);
    await new Promise(r => setTimeout(r, 50));
    expect(done).toBe(1);
  });
});
