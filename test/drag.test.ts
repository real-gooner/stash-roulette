import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeDraggable } from '../src/ui/drag';

function ptr(type: string, x: number, y: number, id = 1): Event {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 });
  Object.defineProperty(e, 'pointerId', { value: id });
  return e;
}
let el: HTMLElement;
beforeEach(() => {
  document.body.innerHTML = '<div id="d" style="position:fixed;left:100px;top:100px;width:50px;height:50px"><button class="ib">x</button></div>';
  el = document.getElementById('d') as HTMLElement;
  el.setPointerCapture = vi.fn();
  Object.defineProperty(el, 'offsetWidth', { value: 50 });
  Object.defineProperty(el, 'offsetHeight', { value: 50 });
  el.getBoundingClientRect = () => ({ left: parseFloat(el.style.left) || 100, top: parseFloat(el.style.top) || 100, width: 50, height: 50, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} });
});

describe('makeDraggable', () => {
  it('treats small movement as a click, not a drag', () => {
    const onStart = vi.fn(), onEnd = vi.fn();
    makeDraggable(el, { onStart, onEnd });
    el.dispatchEvent(ptr('pointerdown', 110, 110)); el.dispatchEvent(ptr('pointermove', 112, 111)); el.dispatchEvent(ptr('pointerup', 112, 111));
    expect(onStart).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ moved: false }));
  });
  it('starts once, moves the element, and reports moved on release', () => {
    const onStart = vi.fn(), onEnd = vi.fn();
    makeDraggable(el, { onStart, onEnd });
    el.dispatchEvent(ptr('pointerdown', 110, 110)); el.dispatchEvent(ptr('pointermove', 140, 140)); el.dispatchEvent(ptr('pointermove', 160, 150));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(el.style.left).toBe('150px');
    el.dispatchEvent(ptr('pointerup', 160, 150));
    expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({ moved: true }));
  });
  it('ends cleanly on pointercancel so no stale drag remains', () => {
    const onEnd = vi.fn();
    makeDraggable(el, { onEnd });
    el.dispatchEvent(ptr('pointerdown', 110, 110)); el.dispatchEvent(ptr('pointermove', 150, 150)); el.dispatchEvent(ptr('pointercancel', 150, 150));
    expect(onEnd).toHaveBeenCalledTimes(1);
    el.dispatchEvent(ptr('pointermove', 300, 300)); // must not move after cancel
    expect(el.style.left).toBe('140px');
  });
  it('ignores presses on ignored children', () => {
    const onEnd = vi.fn();
    makeDraggable(el, { ignore: '.ib', onEnd });
    (el.querySelector('.ib') as HTMLElement).dispatchEvent(ptr('pointerdown', 110, 110));
    el.dispatchEvent(ptr('pointerup', 110, 110));
    expect(onEnd).not.toHaveBeenCalled();
  });
  it('keeps the element inside the window', () => {
    makeDraggable(el);
    el.dispatchEvent(ptr('pointerdown', 110, 110)); el.dispatchEvent(ptr('pointermove', -500, -500));
    expect(parseFloat(el.style.left)).toBeGreaterThanOrEqual(4);
    expect(parseFloat(el.style.top)).toBeGreaterThanOrEqual(4);
  });
});
