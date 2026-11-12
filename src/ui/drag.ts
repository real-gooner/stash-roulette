import { clampBox } from './geometry';

export interface DragOptions {
  /** Element that starts the drag (defaults to the moved element). */
  handle?: HTMLElement;
  /** Clicks inside matching elements never start a drag. */
  ignore?: string;
  onStart?: () => void;
  /** Called once when the gesture ends, whether it moved or not. */
  onEnd?: (r: { moved: boolean; left: number; top: number }) => void;
}

type S = { kind: 'idle' } | { kind: 'pending' | 'dragging'; sx: number; sy: number; left: number; top: number; id: number };
const THRESHOLD = 4;

/**
 * Pointer drag as a small state machine: idle -> pending -> dragging -> idle.
 * pointerup, pointercancel and lostpointercapture all end the gesture, so an
 * interrupted drag can never leave stale state behind.
 */
export function makeDraggable(el: HTMLElement, opts: DragOptions = {}): void {
  const handle = opts.handle ?? el;
  let s: S = { kind: 'idle' };

  const end = (): void => {
    if (s.kind === 'idle') return;
    const wasDragging = s.kind === 'dragging';
    s = { kind: 'idle' };
    if (wasDragging) swallowNextClick(handle);
    const r = el.getBoundingClientRect();
    opts.onEnd?.({ moved: wasDragging, left: r.left, top: r.top });
  };

  handle.addEventListener('pointerdown', e => {
    if (e.button !== 0 || (opts.ignore && (e.target as Element).closest?.(opts.ignore))) return;
    const r = el.getBoundingClientRect();
    s = { kind: 'pending', sx: e.clientX, sy: e.clientY, left: r.left, top: r.top, id: e.pointerId };
    try { handle.setPointerCapture(e.pointerId); } catch { /* capture is best effort */ }
  });
  handle.addEventListener('pointermove', e => {
    if (s.kind === 'idle') return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    if (s.kind === 'pending') {
      if (Math.hypot(dx, dy) < THRESHOLD) return;
      s = { ...s, kind: 'dragging' };
      opts.onStart?.();
    }
    const p = clampBox({ left: s.left + dx, top: s.top + dy }, { w: el.offsetWidth, h: el.offsetHeight }, { w: innerWidth, h: innerHeight }, 4);
    Object.assign(el.style, { left: p.left + 'px', top: p.top + 'px', right: 'auto', bottom: 'auto' });
  });
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  handle.addEventListener('lostpointercapture', end);
}

function swallowNextClick(target: HTMLElement): void {
  const swallow = (ev: Event): void => { ev.stopPropagation(); ev.preventDefault(); };
  target.addEventListener('click', swallow, { capture: true, once: true });
  setTimeout(() => target.removeEventListener('click', swallow, true), 100);
}
