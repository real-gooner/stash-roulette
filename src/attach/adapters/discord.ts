import type { SiteAdapter } from './types';

export const discordAdapter: SiteAdapter = {
  site: 'discord',
  composerSelector: '[role="dialog"], form, [class*="channelTextArea"]',
  textboxSelectors: ['[data-slate-editor="true"]', '[role="textbox"]', '[contenteditable]:not([contenteditable="false"])', 'textarea'],
  label: () => (location.pathname.startsWith('/channels/@me') ? 'Discord DM' : 'Discord channel'),
};
