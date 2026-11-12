import { icons } from './icons';

const ib = (act: string, tip: string, icon: string, extra = ''): string =>
  `<button class="ib ${extra}" data-act="${act}" data-tip="${tip}" aria-label="${tip.split(' · ')[0]}">${icon}</button>`;
const mi = (act: string, label: string, icon: string): string => `<button class="mi" role="menuitem" data-act="${act}">${icon}<span>${label}</span></button>`;
const sel = (f: string, label: string, opts: [string, string][]): string =>
  `<select class="fs" data-f="${f}" aria-label="${label}">${opts.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select>`;

export const template = (): string => `
<button class="fab" aria-label="Stash Roulette"></button>
<div class="panel hidden" role="dialog" aria-label="Stash Roulette">
  <div class="hd">
    <span class="logo">${icons.dice}</span>
    <div class="ttl">Stash Roulette</div>
    ${ib('random', 'Attach random · Alt+Shift+R', icons.dice, 'accent')}
    ${ib('shuffle', 'Shuffle order · Alt+Shift+S', icons.shuffle)}
    ${ib('select', 'Select several (max 4) · ⌘-click', icons.layers)}
    <span class="sep"></span>
    ${ib('refresh', 'Rescan folder', icons.refresh)}
    ${ib('more', 'More', icons.more)}
    ${ib('close', 'Close · Alt+Shift+M', icons.close)}
  </div>
  <div class="menu hidden" role="menu">
    ${mi('change', 'Choose a different folder', icons.folder)}
    ${mi('reselect', 'Re-select current folder', icons.refresh)}
    ${mi('resetpos', 'Reset panel position', icons.expand)}
  </div>
  <div class="searchwrap"><span class="searchIcon">${icons.search}</span><input class="search" placeholder="Search files…" spellcheck="false" aria-label="Search files"></div>
  <div class="filters">
    ${sel('type', 'Filter by type', [['all', 'All types'], ['img', 'Images'], ['vid', 'Videos']])}
    ${sel('dur', 'Filter by length', [['all', 'Any length'], ['short', 'Under 15s'], ['med', '15–60s'], ['long', '1–5 min'], ['xl', 'Over 5 min']])}
    ${sel('max', 'Maximum file size', [['all', 'Any size'], ['5', '≤ 5 MB'], ['10', '≤ 10 MB'], ['25', '≤ 25 MB'], ['50', '≤ 50 MB']])}
    ${sel('sort', 'Sort order', [['name', 'Sort: Name'], ['date', 'Sort: Newest'], ['size', 'Sort: Largest'], ['dur', 'Sort: Longest']])}
    <button class="reset hidden" data-act="resetfilters">Reset</button>
  </div>
  <div class="countbar" aria-live="polite"></div>
  <div class="grid"></div>
  <div class="qbar hidden"><span class="qcount">0 selected</span><button class="btn" data-act="qattach">Attach</button><button class="btn ghost" data-act="qclear">Clear</button></div>
  <div class="ft" aria-live="polite"></div>
  <div class="resize" data-tip="Drag to resize"></div>
  <div class="lb hidden">
    <div class="lbmedia"></div>
    <div class="lbinfo"><div class="lbname"></div><div class="lbmeta"></div></div>
    <div class="lbcontrols">
      <button class="lbbtn" data-act="lbprev" aria-label="Previous">‹</button>
      <button class="lbbtn primary" data-act="lbattach">Attach</button>
      <button class="lbbtn" data-act="lbnext" aria-label="Next">›</button>
      <button class="lbbtn" data-act="lbclose" aria-label="Close preview">✕</button>
    </div>
  </div>
</div>
<div class="toasts" role="status"></div>`;
