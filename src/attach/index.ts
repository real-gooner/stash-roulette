import { tryFrameBridge } from './bridge';
import { attachFileToComposer, type AttachCtx, type AttachResult } from './engine';
import { collectDocs, collectShadowRoots, rootAsDoc } from './frames';

export type { AttachCtx, AttachResult };
export { focusComposer, isEditable } from './engine';

type Outcome = AttachResult | { method: string; label: string; target?: Element | null };

/** Page first, then same-origin frames, open shadow roots, and last the trusted-origin bridge. */
export async function attachFile(file: File, ctx: AttachCtx): Promise<Outcome> {
  try {
    return attachFileToComposer(file, document, ctx);
  } catch { ctx.log('attach: no composer on page, checking frames'); }

  const frames = collectDocs(document).slice(1);
  for (const [i, d] of frames.entries()) {
    try { return attachFileToComposer(file, d, ctx, `frame[${i}]`); } catch { /* try next */ }
  }
  for (const d of [document, ...frames]) {
    for (const [i, r] of collectShadowRoots(d, ctx).entries()) {
      try { return attachFileToComposer(file, rootAsDoc(r), ctx, `shadow[${i}]`); } catch { /* try next */ }
    }
  }
  const r = await tryFrameBridge(file);
  if (r) return { method: 'frame ' + r.method, label: r.label };
  throw new Error('No composer found. Click into the message box first, then try again.');
}
