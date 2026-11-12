import type { AttachCtx, DocLike } from './engine';

/** Same-origin documents reachable from `root`, nested iframes included. */
export function collectDocs(root: Document, maxDepth = 3): Document[] {
  const docs: Document[] = [];
  const walk = (doc: Document, depth: number): void => {
    if (depth > maxDepth || docs.includes(doc)) return;
    docs.push(doc);
    for (const f of [...doc.querySelectorAll('iframe, frame')] as HTMLIFrameElement[]) {
      let d: Document | null = null;
      try { d = f.contentDocument; } catch { d = null; }
      if (d) walk(d, depth + 1);
    }
  };
  walk(root, 0);
  return docs;
}

/** Open shadow roots anywhere under `root` (never our own UI). */
export function collectShadowRoots(root: ParentNode, ctx: AttachCtx): ShadowRoot[] {
  const roots: ShadowRoot[] = [];
  const scan = (node: ParentNode): void => {
    for (const el of [...node.querySelectorAll('*')]) {
      if (!el.shadowRoot || el === ctx.host || ctx.host.contains(el)) continue;
      roots.push(el.shadowRoot);
      scan(el.shadowRoot);
    }
  };
  scan(root);
  return roots;
}

/** Adapt a ShadowRoot so the attach engine can query it like a document. */
export function rootAsDoc(root: ShadowRoot): DocLike {
  return {
    querySelectorAll: sel => root.querySelectorAll(sel),
    get activeElement() { return root.activeElement; },
    get body() { return null; },
    get documentElement() { return null; },
    get defaultView() { return window; },
    designMode: 'off',
  };
}

/** Cross-origin iframes: only those we could address, with their origin. */
export function crossOriginFrames(root: Document): { win: Window; origin: string }[] {
  const out: { win: Window; origin: string }[] = [];
  const walk = (doc: Document): void => {
    for (const f of [...doc.querySelectorAll('iframe, frame')] as HTMLIFrameElement[]) {
      let d: Document | null = null;
      try { d = f.contentDocument; } catch { d = null; }
      if (d) { walk(d); continue; }
      if (!f.contentWindow) continue;
      try { out.push({ win: f.contentWindow, origin: new URL(f.src, doc.baseURI).origin }); } catch { /* no usable src */ }
    }
  };
  walk(root);
  return out;
}
