import type { SiteAdapter } from './types';

export const xAdapter: SiteAdapter = {
  site: 'x',
  composerSelector:
    '[role="dialog"], [data-testid="DMDrawer"], [data-testid="toolBar"], [data-testid="tweetCompose"], [data-testid="composer"], [data-testid="dmComposerTextInput"]',
  textboxSelectors: [
    '[data-testid="dmComposerTextInput"]',
    '[data-testid^="tweetTextarea"]',
    '[data-testid*="Composer"] [contenteditable]',
    '[data-slate-editor="true"]',
    '[contenteditable]:not([contenteditable="false"])',
    '[role="textbox"]',
    'textarea',
    'input[type="text"]',
    'input:not([type])',
  ],
  label(t, _doc, inFrame) {
    if (t?.matches('[data-testid="dmComposerTextInput"]')) return 'DM chat';
    if (t?.matches('[data-testid^="tweetTextarea"]')) return t.closest('[aria-labelledby="modal-header"]') ? 'reply modal' : 'tweet box';
    if (t?.closest('[data-testid="DMDrawer"]')) return 'DM chat';
    if (t?.closest('[aria-labelledby="modal-header"]')) return 'reply modal';
    if (inFrame || location.pathname.startsWith('/i/chat')) return 'DM chat';
    return t ? 'text box' : 'tweet box';
  },
};
