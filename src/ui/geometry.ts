export interface Rect { left: number; top: number; width: number; height: number }
export interface Size { w: number; h: number }

const MARGIN = 8;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(Math.max(v, lo), Math.max(lo, hi));

/**
 * Tooltip placement. Prefers below the target, flips above when there is no
 * room, centres on the target, then clamps into the viewport so text is never
 * cut off at any edge.
 */
export function placeTooltip(target: Rect, tip: Size, vp: Size, gap = 8): { left: number; top: number; side: 'below' | 'above' } {
  const below = target.top + target.height + gap;
  const fitsBelow = below + tip.h <= vp.h - MARGIN;
  const side = fitsBelow ? 'below' : 'above';
  const top = side === 'below' ? below : Math.max(MARGIN, target.top - gap - tip.h);
  const left = clamp(target.left + target.width / 2 - tip.w / 2, MARGIN, vp.w - tip.w - MARGIN);
  return { left: Math.round(left), top: Math.round(top), side };
}

/** Keep a box fully inside the viewport. */
export function clampBox(pos: { left: number; top: number }, size: Size, vp: Size, margin = MARGIN): { left: number; top: number } {
  return { left: clamp(pos.left, margin, vp.w - size.w - margin), top: clamp(pos.top, margin, vp.h - size.h - margin) };
}

const overlaps = (a: Rect, b: Rect): boolean =>
  a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;

/**
 * Anchor the panel next to the floating button without ever covering it.
 * Tries above, then below, then left, then right of the button (right edges
 * aligned for above/below); the first spot that fits fully on screen wins.
 * If nothing fits (tiny viewport), the least-overlapping spot is clamped in.
 */
export function anchorPanel(fab: Rect, panel: Size, vp: Size, gap = 10): { left: number; top: number } {
  const alignedLeft = clamp(fab.left + fab.width - panel.w, MARGIN, vp.w - panel.w - MARGIN);
  const sideTop = clamp(fab.top + fab.height - panel.h, MARGIN, vp.h - panel.h - MARGIN);
  const candidates = [
    { left: alignedLeft, top: fab.top - panel.h - gap },
    { left: alignedLeft, top: fab.top + fab.height + gap },
    { left: fab.left - panel.w - gap, top: sideTop },
    { left: fab.left + fab.width + gap, top: sideTop },
  ];
  const fits = (c: { left: number; top: number }): boolean =>
    c.left >= MARGIN && c.top >= MARGIN && c.left + panel.w <= vp.w - MARGIN && c.top + panel.h <= vp.h - MARGIN;
  const box = (c: { left: number; top: number }): Rect => ({ ...c, width: panel.w, height: panel.h });
  const ok = candidates.find(c => fits(c) && !overlaps(box(c), fab));
  if (ok) return ok;
  const clamped = candidates.map(c => clampBox(c, panel, vp));
  return clamped.find(c => !overlaps(box(c), fab)) ?? (clamped[0] as { left: number; top: number });
}

/**
 * After the panel is dropped, make sure it neither leaves the viewport nor sits on
 * top of the button, so its header can always be grabbed again.
 */
export function settlePanel(pos: { left: number; top: number }, panel: Size, fab: Rect, vp: Size): { left: number; top: number } {
  let p = clampBox(pos, panel, vp);
  const box = (q: { left: number; top: number }): Rect => ({ left: q.left, top: q.top, width: panel.w, height: panel.h });
  if (!overlaps(box(p), fab)) return p;
  const candidates = [
    { left: p.left, top: fab.top - panel.h - MARGIN },
    { left: p.left, top: fab.top + fab.height + MARGIN },
    { left: fab.left - panel.w - MARGIN, top: p.top },
    { left: fab.left + fab.width + MARGIN, top: p.top },
  ].map(c => clampBox(c, panel, vp));
  p = candidates.find(c => !overlaps(box(c), fab)) ?? candidates[0] ?? p;
  return p;
}
