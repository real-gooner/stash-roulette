import { placeTooltip } from './geometry';

/**
 * One tooltip element, owned by the shadow root and positioned in JS, so it is
 * never clipped by the panel and always stays inside the viewport.
 */
export class Tooltip {
  private el: HTMLElement;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private suspended = false;
  private current: HTMLElement | null = null;
  private seq = 0;

  constructor(private root: ShadowRoot) {
    this.el = document.createElement('div');
    this.el.className = 'tip';
    this.el.id = 'sr-tip';
    this.el.setAttribute('role', 'tooltip');
    root.appendChild(this.el);
    const find = (e: Event): HTMLElement | null => (e.target as Element | null)?.closest?.('[data-tip]') as HTMLElement | null;
    root.addEventListener('pointerover', e => { const t = find(e); if (t) this.schedule(t); });
    root.addEventListener('pointerout', e => { if (find(e)) this.hide(); });
    root.addEventListener('focusin', e => { const t = find(e); if (t && (t as HTMLElement).matches(':focus-visible')) this.schedule(t, 0); });
    root.addEventListener('focusout', () => this.hide());
    root.addEventListener('pointerdown', () => this.hide(), true);
    root.addEventListener('keydown', e => { if ((e as KeyboardEvent).key === 'Escape') this.hide(); }, true);
    root.addEventListener('scroll', () => this.hide(), true);
  }

  setSuspended(v: boolean): void { this.suspended = v; if (v) this.hide(); }

  private schedule(t: HTMLElement, delay = 350): void {
    this.hide();
    if (this.suspended || !t.dataset.tip) return;
    const my = ++this.seq;
    this.timer = setTimeout(() => { if (my === this.seq) this.show(t); }, delay);
  }

  private show(t: HTMLElement): void {
    const text = t.dataset.tip ?? '';
    const [label, hint] = text.split(' · ');
    this.el.replaceChildren(Object.assign(document.createElement('span'), { textContent: label }));
    if (hint) this.el.append(Object.assign(document.createElement('kbd'), { textContent: hint }));
    this.el.style.visibility = 'hidden';
    this.el.classList.add('on');
    const r = t.getBoundingClientRect();
    const p = placeTooltip(
      { left: r.left, top: r.top, width: r.width, height: r.height },
      { w: this.el.offsetWidth, h: this.el.offsetHeight },
      { w: innerWidth, h: innerHeight },
    );
    this.el.style.left = p.left + 'px';
    this.el.style.top = p.top + 'px';
    this.el.style.visibility = '';
    this.current = t;
    t.setAttribute('aria-describedby', 'sr-tip');
  }

  hide(): void {
    this.seq++;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.el.classList.remove('on');
    this.current?.removeAttribute('aria-describedby');
    this.current = null;
  }
}
