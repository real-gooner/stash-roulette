import { isTrustedOrigin } from '../config';
import { attachFileToComposer, type AttachCtx, type AttachResult } from './engine';
import { crossOriginFrames } from './frames';

const TAG = '__stashRoulette';
type Reply = { method: AttachResult['method']; label: string };

/**
 * Send the file to cross-origin iframes. Only frames whose origin is on our
 * allowlist receive it, and each message names its exact target origin, so the
 * file can never reach an ad or embed frame.
 */
export function tryFrameBridge(file: File, timeoutMs = 1500): Promise<Reply | null> {
  const targets = crossOriginFrames(document).filter(t => isTrustedOrigin(t.origin));
  if (!targets.length) return Promise.resolve(null);
  return new Promise(resolve => {
    let pending = targets.length;
    let finished = false;
    const finish = (r: Reply | null): void => {
      if (finished) return;
      finished = true;
      window.removeEventListener('message', onMsg, true);
      resolve(r);
    };
    const onMsg = (e: MessageEvent): void => {
      const d = e.data as { [TAG]?: string; ok?: boolean; method?: Reply['method']; label?: string } | null;
      if (!d || d[TAG] !== 'result') return;
      if (!targets.some(t => t.win === e.source && t.origin === e.origin)) return;
      if (d.ok && d.method) return finish({ method: d.method, label: d.label ?? 'chat' });
      if (--pending <= 0) finish(null);
    };
    window.addEventListener('message', onMsg, true);
    for (const t of targets) {
      try { t.win.postMessage({ [TAG]: 'attach', file }, t.origin); } catch { pending--; }
    }
    setTimeout(() => finish(null), timeoutMs);
  });
}

/** Runs inside iframes: accept a file only from a trusted ancestor and reply to its exact origin. */
export function listenInFrame(ctx: AttachCtx): void {
  window.addEventListener('message', e => {
    const d = e.data as { [TAG]?: string; file?: unknown } | null;
    if (!d || d[TAG] !== 'attach' || !(d.file instanceof File)) return;
    if (e.source !== window.top && e.source !== window.parent) return;
    if (!isTrustedOrigin(e.origin)) return;
    const reply = (msg: object): void => { (e.source as Window | null)?.postMessage({ [TAG]: 'result', ...msg }, e.origin); };
    try {
      const res = attachFileToComposer(d.file, document, ctx);
      reply({ ok: true, method: res.method, label: res.label });
    } catch (err) {
      reply({ ok: false, error: (err as Error).message });
    }
  });
}
