import { describe, expect, it } from 'vitest';
import { anchorPanel, clampBox, placeTooltip, settlePanel } from '../src/ui/geometry';

const vp = { w: 1000, h: 800 };
const tip = { w: 200, h: 28 };

describe('placeTooltip (fixes clipped hover text)', () => {
  it('centres below a mid-screen icon', () => {
    const r = placeTooltip({ left: 500, top: 100, width: 30, height: 30 }, tip, vp);
    expect(r.side).toBe('below'); expect(r.left).toBe(415);
  });
  it('stays inside the viewport for an icon on the far left', () => {
    const r = placeTooltip({ left: 4, top: 100, width: 30, height: 30 }, tip, vp);
    expect(r.left).toBeGreaterThanOrEqual(8);
  });
  it('stays inside the viewport for an icon on the far right', () => {
    const r = placeTooltip({ left: 970, top: 100, width: 30, height: 30 }, tip, vp);
    expect(r.left + tip.w).toBeLessThanOrEqual(vp.w - 8);
  });
  it('flips above near the bottom edge', () => {
    const r = placeTooltip({ left: 500, top: 780, width: 30, height: 30 }, tip, vp);
    expect(r.side).toBe('above'); expect(r.top).toBeLessThan(780);
  });
});

describe('panel placement', () => {
  const panel = { w: 380, h: 600 };
  it('anchors above the button, right-aligned', () => {
    const p = anchorPanel({ left: 936, top: 736, width: 50, height: 50 }, panel, vp);
    expect(p.left).toBe(606); expect(p.top).toBe(126);
  });
  it('goes beside the button when there is no room above or below', () => {
    const fab = { left: 560, top: 404, width: 50, height: 50 };
    const tall = { w: 384, h: 553 };
    const p = anchorPanel(fab, tall, { w: 1024, h: 768 });
    const hit = p.left < fab.left + fab.width && p.left + tall.w > fab.left && p.top < fab.top + fab.height && p.top + tall.h > fab.top;
    expect(hit).toBe(false);
    expect(p.left).toBeGreaterThanOrEqual(8);
    expect(p.left + tall.w).toBeLessThanOrEqual(1024 - 8);
  });
  it('clamps into the viewport', () => {
    expect(clampBox({ left: -50, top: 900 }, panel, vp)).toEqual({ left: 8, top: 192 });
  });
  it('never leaves the panel on top of the button', () => {
    const fab = { left: 936, top: 736, width: 50, height: 50 };
    const p = settlePanel({ left: 700, top: 400 }, panel, fab, vp);
    const hit = p.left < fab.left + fab.width && p.left + panel.w > fab.left && p.top < fab.top + fab.height && p.top + panel.h > fab.top;
    expect(hit).toBe(false);
  });
});
