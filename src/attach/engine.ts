import type { SiteAdapter } from './adapters';

/** What the engine needs from the UI layer. */
export interface AttachCtx {
  adapter: SiteAdapter;
  /** Our own shadow host: never attach into our own UI. */
  host: Element;
  lastFocusedEditable: () => Element | null;
  log: (...a: unknown[]) => void;
}

export interface AttachResult {
  method: 'file input' | 'paste' | 'drop';
  label: string;
  target: Element | null;
}

/** A document, or a shadow root adapted to look like one. */
export interface DocLike {
  querySelectorAll(sel: string): Iterable<Element>;
  readonly activeElement: Element | null;
  readonly body: HTMLElement | null;
  readonly documentElement: HTMLElement | null;
  readonly defaultView: (Window & typeof globalThis) | null;
  designMode: string;
}

const isVisible = (el: Element): boolean => el.getClientRects().length > 0;
const NON_TEXT_INPUT = /^(button|checkbox|radio|file|hidden|image|submit|reset)$/i;

export function isEditable(el: Element | null, host: Element): boolean {
  if (!el || host.contains(el)) return false;
  const h = el as HTMLElement;
  return (
    h.isContentEditable === true ||
    el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && !NON_TEXT_INPUT.test((el as HTMLInputElement).type || ''))
  );
}

function fileInputs(doc: DocLike, ctx: AttachCtx): HTMLInputElement[] {
  return ([...doc.querySelectorAll('input[type="file"]')] as HTMLInputElement[]).filter(i => !ctx.host.contains(i));
}

export function pickFileInput(doc: DocLike, ctx: AttachCtx): HTMLInputElement | null {
  const inputs = fileInputs(doc, ctx);
  if (!inputs.length) return null;
  // Walk up from the focused text box and take the first file input in the same subtree.
  const last = ctx.lastFocusedEditable();
  const ae = doc.activeElement;
  const ref = last?.isConnected && !ctx.host.contains(last) ? last : ae && ae !== doc.body && !ctx.host.contains(ae) ? ae : null;
  for (let node: Element | null = ref, depth = 0; node && node !== doc.body && node !== doc.documentElement && depth < 22; node = node.parentElement, depth++) {
    const inp = node.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (inp && !ctx.host.contains(inp)) return inp;
  }
  const visible = inputs.filter(i => {
    const c = i.closest(ctx.adapter.composerSelector + ', form');
    return !!c && (typeof c.checkVisibility === 'function' ? c.checkVisibility() : isVisible(c));
  });
  if (visible.length) return visible.find(i => i.closest('[aria-labelledby="modal-header"]')) ?? (visible[visible.length - 1] as HTMLInputElement);
  return inputs[inputs.length - 1] as HTMLInputElement;
}

export function pickTextTarget(doc: DocLike, ctx: AttachCtx): Element | null {
  if (doc.designMode === 'on' && doc.body) return doc.body;
  for (const c of [ctx.lastFocusedEditable(), doc.activeElement !== doc.body ? doc.activeElement : null]) {
    if (c && c.isConnected && isEditable(c, ctx.host)) return c;
  }
  if (doc.body?.isContentEditable) return doc.body;
  for (const sel of ctx.adapter.textboxSelectors) {
    const els = ([...doc.querySelectorAll(sel)] as Element[]).filter(el => !ctx.host.contains(el) && el.isConnected);
    if (!els.length) continue;
    const vis = els.filter(isVisible);
    return (vis.length ? vis : els).slice(-1)[0] ?? null;
  }
  return null;
}

/** Try, in order: hidden file input, synthetic paste, synthetic drop. */
export function attachFileToComposer(file: File, doc: DocLike, ctx: AttachCtx, viaLabel = ''): AttachResult {
  const W = doc.defaultView ?? window;
  const prefix = viaLabel ? viaLabel + ' ' : '';
  const tried: string[] = [];
  const makeDT = (): DataTransfer => { const dt = new W.DataTransfer(); dt.items.add(file); return dt; };
  const inFrame = (doc as Document) !== document;

  const input = pickFileInput(doc, ctx);
  if (input) {
    try {
      input.files = makeDT().files;
      input.dispatchEvent(new W.Event('input', { bubbles: true }));
      input.dispatchEvent(new W.Event('change', { bubbles: true }));
      const t = pickTextTarget(doc, ctx);
      return { method: 'file input', label: prefix + ctx.adapter.label(t, doc as unknown as ParentNode, inFrame), target: t };
    } catch (e) { tried.push('fileInput(' + (e as Error).name + ')'); }
  }
  const t = pickTextTarget(doc, ctx);
  if (t) {
    try {
      t.dispatchEvent(new W.ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: makeDT() }));
      return { method: 'paste', label: prefix + ctx.adapter.label(t, doc as unknown as ParentNode, inFrame), target: t };
    } catch (e) { tried.push('paste(' + (e as Error).name + ')'); }
    try {
      t.dispatchEvent(new W.DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: makeDT() }));
      return { method: 'drop', label: prefix + ctx.adapter.label(t, doc as unknown as ParentNode, inFrame), target: t };
    } catch (e) { tried.push('drop(' + (e as Error).name + ')'); }
  }
  throw new Error('No composer found. Click into the message box first, then try again.' + (tried.length ? ' (' + tried.join(', ') + ')' : ''));
}

/** Put the caret back in the composer so the user can type straight away. */
export function focusComposer(target: Element | null, ctx: AttachCtx): boolean {
  let el: Element | null = target && target.isConnected && !ctx.host.contains(target) ? target : null;
  const last = ctx.lastFocusedEditable();
  if (!el && last?.isConnected && !ctx.host.contains(last)) el = last;
  if (!el) el = pickTextTarget(document, ctx);
  if (!el) return false;
  try {
    const h = el as HTMLElement;
    h.focus();
    const doc = el.ownerDocument;
    const win = doc.defaultView ?? window;
    if (h.isContentEditable) {
      const sel = win.getSelection();
      if (sel) { const r = doc.createRange(); r.selectNodeContents(h); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const f = el as HTMLInputElement;
      const n = f.value?.length ?? 0;
      try { f.setSelectionRange(n, n); } catch { /* some input types have no selection */ }
    }
    return true;
  } catch { return false; }
}
