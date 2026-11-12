import { attachFile, focusComposer, isEditable, type AttachCtx } from '../attach';
import { adapterFor } from '../attach/adapters';
import { pickFileInput, pickTextTarget } from '../attach/engine';
import { CHUNK, HOST_ID, IMG_RE, LEGACY_IDB_NAME, MAX_THUMB, QUEUE_MAX, THUMB_CAP, VID_RE, type Site } from '../config';
import { applyFilters, defaultFilters, hasActiveFilters, orderFiles, pickRandom, shuffleArray } from '../library/filter-sort';
import { scanFolder } from '../library/scan';
import { idbGet, idbSet } from '../storage/idb';
import { loadMeta, saveMetaSoon } from '../storage/meta-cache';
import { loadPrefs, savePrefs, type Prefs } from '../storage/prefs';
import { ThumbCache } from '../thumbs/lru';
import { imageThumb, videoThumb, withTimeout } from '../thumbs/decode';
import { TaskQueue } from '../thumbs/queue';
import type { AppState, Filters, MediaItem, Meta } from '../types';
import { fmtDur, fmtSize } from '../util/format';
import { log } from '../util/log';
import { makeDraggable } from './drag';
import { anchorPanel, clamp, settlePanel } from './geometry';
import { icons } from './icons';
import { css } from './styles';
import { template } from './template';
import { Tooltip } from './tooltip';

type Rect = { left: number; top: number; width: number; height: number };
const rectOf = (el: HTMLElement): Rect => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };

export class App {
  private host = document.createElement('div');
  private root = this.host.attachShadow({ mode: 'open' });
  private prefs: Prefs = loadPrefs();
  private isDiscord: boolean;

  // state
  private files: MediaItem[] = [];
  private byName = new Map<string, MediaItem>();
  private meta = new Map<string, Meta>();
  private filters: Filters;
  private shuffled = !!this.prefs.shuffled;
  private state: AppState = 'loading';
  private dir: FileSystemDirectoryHandle | null = null;
  private pending: FileSystemDirectoryHandle | null = null;
  private folderLabel = '';
  private selectMode = false;
  private queue = new Set<string>();
  private queueBusy = false;
  private rendered = 0;
  private recent: string[] = [];
  private lbItem: MediaItem | null = null;
  private lbUrl: string | null = null;
  private indexGen = 0;
  private indexing = false;
  private lastEditable: Element | null = null;

  // dom
  private fab!: HTMLButtonElement;
  private panel!: HTMLElement;
  private grid!: HTMLElement;
  private q = <T extends Element>(sel: string): T => this.root.querySelector(sel) as T;

  private thumbs = new ThumbCache(THUMB_CAP);
  private thumbQueue = new TaskQueue<HTMLElement>(MAX_THUMB, t => this.processThumb(t), () => this.sweepSoon(), 120);
  private tooltip!: Tooltip;

  constructor(private site: Site) {
    this.isDiscord = site === 'discord';
    this.filters = defaultFilters(this.isDiscord);
  }

  private get ctx(): AttachCtx {
    return { adapter: adapterFor(this.site), host: this.host, lastFocusedEditable: () => this.lastEditable, log };
  }

  // ------------------------------------------------------------------ boot
  async start(): Promise<void> {
    this.host.id = HOST_ID;
    this.root.innerHTML = `<style>${css}</style>${template()}`;
    document.documentElement.appendChild(this.host);
    this.fab = this.q('.fab');
    this.panel = this.q('.panel');
    this.grid = this.q('.grid');
    this.tooltip = new Tooltip(this.root);
    this.q<HTMLSelectElement>('select[data-f="max"]').value = this.filters.maxMb;
    this.restoreLayout();
    this.bindEvents();
    this.setState('loading');
    this.setStatus('Checking saved folder…');

    const saved = (await idbGet<FileSystemDirectoryHandle>('dirHandle').catch(() => undefined)) ?? (await this.legacyHandle());
    if (!saved) {
      this.setState('needPick');
      this.setStatus('Pick your media folder to begin');
      this.toast('Click the floating button and pick your media folder');
      return;
    }
    let perm: PermissionState = 'granted';
    try { perm = await (saved as FileSystemDirectoryHandle & { queryPermission(o: object): Promise<PermissionState> }).queryPermission({ mode: 'read' }); } catch { /* assume granted */ }
    if (perm === 'granted') await this.useFolder(saved);
    else {
      this.pending = saved;
      this.setState('needPerm');
      this.setStatus('Folder permission expired. Click the orange button to reconnect');
      this.toast('Click the orange button to reconnect your media folder');
    }
  }

  /** Folder chosen with the old "X Random Media Picker" script, if any. */
  private async legacyHandle(): Promise<FileSystemDirectoryHandle | undefined> {
    try { return await idbGet<FileSystemDirectoryHandle>('dirHandle', LEGACY_IDB_NAME); } catch { return undefined; }
  }

  private restoreLayout(): void {
    const { panel, btn } = this.prefs;
    if (btn?.pos) this.placeFab(btn.pos.l, btn.pos.t);
    if (panel?.w) {
      this.panel.style.width = clamp(panel.w, 320, innerWidth - 24) + 'px';
      this.panel.style.height = clamp(panel.h ?? 640, 360, innerHeight - 24) + 'px';
    }
  }

  private placeFab(l: number, t: number): void {
    Object.assign(this.fab.style, { left: clamp(l, 8, innerWidth - 58) + 'px', top: clamp(t, 8, innerHeight - 58) + 'px', right: 'auto', bottom: 'auto' });
  }

  // ------------------------------------------------------------------ small ui helpers
  private toast(msg: string): void {
    const box = this.q('.toasts');
    const el = Object.assign(document.createElement('div'), { className: 'toast', textContent: msg });
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 260); }, 3400);
    while (box.children.length > 3) box.firstElementChild?.remove();
  }
  private setStatus(t: string): void { this.q('.ft').textContent = t; }

  private setState(s: AppState): void {
    this.state = s;
    this.fab.className = 'fab' + (s === 'needPick' ? ' pick' : s === 'needPerm' ? ' perm' : s === 'loading' ? ' spin' : '');
    const set = (icon: string, tip: string): void => { this.fab.innerHTML = icon; this.fab.dataset.tip = tip; this.fab.setAttribute('aria-label', tip); };
    const ttl = this.q('.ttl');
    if (s === 'needPick') { set(icons.folder, 'Pick your media folder'); ttl.textContent = 'Pick a media folder'; }
    else if (s === 'needPerm') { set(icons.plug, 'Reconnect folder permission'); ttl.textContent = 'Reconnect folder'; }
    else if (s === 'loading') set(icons.spinner, 'Scanning…');
    else { set(icons.dice, 'Stash Roulette'); ttl.textContent = this.folderLabel + ' · ' + this.files.length; }
    this.q<HTMLButtonElement>('[data-act="refresh"]').disabled = s === 'needPick';
    const sh = this.q<HTMLButtonElement>('[data-act="shuffle"]');
    sh.disabled = s === 'needPick' || s === 'loading';
    sh.classList.toggle('accent', this.shuffled);
  }

  // ------------------------------------------------------------------ folder
  private async pickFolder(startIn?: FileSystemHandle | null): Promise<FileSystemDirectoryHandle | null> {
    const w = window as unknown as { showDirectoryPicker(o?: object): Promise<FileSystemDirectoryHandle> };
    if (typeof w.showDirectoryPicker !== 'function') { this.toast('This browser cannot open folders. Use Chrome or Edge.'); return null; }
    try { return await w.showDirectoryPicker(startIn ? { mode: 'read', startIn } : { mode: 'read' }); }
    catch { try { return await w.showDirectoryPicker({ mode: 'read' }); } catch { return null; } }
  }

  private async useFolder(handle: FileSystemDirectoryHandle): Promise<void> {
    this.dir = handle;
    idbSet('dirHandle', handle).catch(() => undefined);
    this.folderLabel = handle.name || 'Media';
    this.setState('loading');
    this.setStatus('Scanning folder…');
    try {
      const list = await scanFolder(handle);
      this.files = orderFiles(list, this.shuffled, this.prefs.shuffleOrder);
      this.byName = new Map(this.files.map(f => [f.name, f]));
      this.meta = await loadMeta(this.folderLabel);
      this.render();
      this.startIndexing();
      this.setState('ready');
      this.setStatus(`${list.length} media files · click a tile to attach`);
      if (!list.length) this.toast('No media files found in this folder');
    } catch {
      this.pending = handle;
      this.setState('needPerm');
      this.setStatus('Folder access failed. Click the orange button to reconnect');
      this.toast('Could not read the folder');
    }
  }

  private async reconnect(): Promise<void> {
    if (!this.pending) { this.setState('needPick'); return; }
    let ok = false;
    try { ok = (await (this.pending as FileSystemDirectoryHandle & { requestPermission(o: object): Promise<PermissionState> }).requestPermission({ mode: 'read' })) === 'granted'; } catch { /* denied */ }
    if (ok) await this.useFolder(this.pending); else this.toast('Permission not granted');
  }

  private async chooseFolder(): Promise<void> {
    const h = await this.pickFolder(this.dir);
    if (h) await this.useFolder(h);
  }

  private async rescan(): Promise<void> {
    if (!this.dir) { this.toast('No folder connected'); return; }
    const before = new Set(this.files.map(f => f.name));
    this.resetFilters(false);
    await this.useFolder(this.dir);
    const added = this.files.map(f => f.name).filter(n => !before.has(n));
    const removed = [...before].filter(n => !this.byName.has(n)).length;
    if (added.length) {
      const set = new Set(added);
      this.files = [...added.map(n => this.byName.get(n) as MediaItem), ...this.files.filter(f => !set.has(f.name))];
      if (this.shuffled) { this.prefs.shuffleOrder = this.files.map(f => f.name); savePrefs(this.prefs); }
      this.render();
    }
    this.grid.scrollTop = 0;
    this.toast('Rescanned · ' + this.files.length + ' files' + (added.length ? ` · +${added.length} new` : '') + (removed ? ` · −${removed}` : '') + (!added.length && !removed ? ' · no changes' : ''));
  }

  // ------------------------------------------------------------------ grid
  private filtered(): MediaItem[] { return applyFilters(this.files, this.filters, this.meta, this.shuffled); }

  private layoutGrid(): void {
    const GAP = 6, MIN = 78;
    const cs = getComputedStyle(this.grid);
    const avail = this.grid.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (avail <= 0) return;
    let n = Math.max(1, Math.floor((avail + GAP) / (MIN + GAP)));
    let tile = Math.floor((avail - (n - 1) * GAP) / n);
    while (tile < MIN && n > 1) { n--; tile = Math.floor((avail - (n - 1) * GAP) / n); }
    this.grid.style.gridTemplateColumns = `repeat(${n}, ${tile}px)`;
    this.grid.style.gridAutoRows = tile + 'px';
  }

  private render(): void {
    this.rendered = 0;
    this.layoutGrid();
    this.grid.replaceChildren();
    this.addChunk();
    this.updateFilterUi();
    this.sweepSoon();
  }

  private addChunk(): void {
    const list = this.filtered();
    if (!list.length) { this.showEmpty(); this.updateCount(); return; }
    const frag = document.createDocumentFragment();
    for (const item of list.slice(this.rendered, this.rendered + CHUNK)) frag.appendChild(this.makeTile(item));
    this.rendered = Math.min(list.length, this.rendered + CHUNK);
    this.grid.appendChild(frag);
    this.updateCount();
  }

  private showEmpty(): void {
    const div = document.createElement('div');
    div.className = 'empty';
    const filtered = hasActiveFilters(this.filters, this.isDiscord);
    div.innerHTML = filtered
      ? '<b>No matches</b>Nothing fits these filters.<br><button class="btn" data-act="resetfilters">Reset filters</button>'
      : this.files.length ? '' : '<b>This folder has no photos or videos</b>Pick another folder.<br><button class="btn" data-act="change">Choose folder</button>';
    this.grid.replaceChildren(div);
  }

  private updateCount(): void {
    const n = this.filtered().length;
    let t = this.rendered >= n ? `${n} files` : `Showing ${this.rendered} of ${n} · scroll for more`;
    if (this.indexing) t += ' · indexing…';
    this.q('.countbar').textContent = t;
  }

  private updateFilterUi(): void {
    const d = defaultFilters(this.isDiscord);
    this.root.querySelectorAll<HTMLSelectElement>('select.fs').forEach(s => {
      const k = s.dataset.f as 'type' | 'dur' | 'max' | 'sort';
      const key = k === 'max' ? 'maxMb' : k;
      s.classList.toggle('on', this.filters[key] !== d[key]);
    });
    this.q('.reset').classList.toggle('hidden', !hasActiveFilters(this.filters, this.isDiscord));
  }

  private resetFilters(render = true): void {
    this.filters = defaultFilters(this.isDiscord);
    this.q<HTMLInputElement>('.search').value = '';
    this.root.querySelectorAll<HTMLSelectElement>('select.fs').forEach(s => {
      const k = s.dataset.f as string;
      s.value = k === 'max' ? this.filters.maxMb : k === 'sort' ? 'name' : 'all';
    });
    if (render) this.render();
  }

  private makeTile(item: MediaItem): HTMLElement {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const isVid = VID_RE.test(item.name);
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'tile' + (this.queue.has(item.name) ? ' queued' : '') + (this.selectMode ? ' selmode' : '');
    t.title = item.name;
    t.dataset.name = item.name;
    t.innerHTML = `<span class="thumb"><span class="ph">${isVid ? icons.play : icons.image}</span>${isVid ? '<span class="badge">VIDEO</span>' : ''}</span><span class="meta"><span class="nm"></span></span><span class="qcheck">${this.queue.has(item.name) ? '✓' : ''}</span>`;
    (t.querySelector('.nm') as HTMLElement).textContent = item.name;
    t.addEventListener('click', e => (this.selectMode || e.ctrlKey || e.metaKey ? this.toggleQueue(item, t) : void this.attachItem(item, t)));
    t.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { clearTimeout(this.hoverTimer); this.hoverTimer = setTimeout(() => void this.startHover(t), 320); } });
    t.addEventListener('pointerleave', () => { clearTimeout(this.hoverTimer); this.hoverSeq++; if (this.hover?.tile === t) this.stopHover(); });
    const chip = document.createElement('button');
    chip.type = 'button'; chip.className = 'chip'; chip.setAttribute('aria-label', 'Preview'); chip.innerHTML = icons.expand;
    chip.addEventListener('click', () => this.openLightbox(item));
    cell.append(t, chip);
    return cell;
  }

  // ------------------------------------------------------------------ hover video preview
  private hoverTimer: ReturnType<typeof setTimeout> | undefined;
  private hover: { tile: HTMLElement; video: HTMLVideoElement; url: string } | null = null;
  private hoverSeq = 0;
  private stopHover(): void {
    this.hoverSeq++;
    if (!this.hover) return;
    const { tile, video, url } = this.hover;
    this.hover = null;
    video.pause(); video.removeAttribute('src'); video.load(); video.remove();
    tile.classList.remove('playing');
    URL.revokeObjectURL(url);
  }
  private async startHover(tile: HTMLElement): Promise<void> {
    const item = this.byName.get(tile.dataset.name ?? '');
    if (!item || !VID_RE.test(item.name) || !tile.isConnected) return;
    this.stopHover();
    const seq = this.hoverSeq;
    let file: File;
    try { file = await item.handle.getFile(); } catch { return; }
    if (!tile.isConnected || seq !== this.hoverSeq) return;
    const url = URL.createObjectURL(file);
    const v = Object.assign(document.createElement('video'), { className: 'hovervid', muted: true, loop: true, playsInline: true, src: url });
    tile.querySelector('.thumb')?.appendChild(v);
    this.hover = { tile, video: v, url };
    v.play().catch(() => undefined);
  }

  // ------------------------------------------------------------------ thumbnails
  private async thumbFor(item: MediaItem, onMeta?: (d: number) => void): Promise<string | null> {
    const hit = this.thumbs.get(item.name);
    if (hit) { if (onMeta && typeof hit.dur === 'number') onMeta(hit.dur); return hit.url; }
    const file = await withTimeout(item.handle.getFile(), 8000, 'getFile');
    const m = this.meta.get(item.name) ?? {};
    m.size = file.size; m.mtime = file.lastModified;
    this.meta.set(item.name, m);
    let dur: number | undefined;
    const url = IMG_RE.test(item.name) ? await imageThumb(file) : await videoThumb(file, d => { dur = d; onMeta?.(d); });
    if (url) this.thumbs.put(item.name, url, dur);
    return url;
  }

  private async processThumb(tile: HTMLElement): Promise<void> {
    if (!tile.isConnected || tile.dataset.loaded === '1' || tile.dataset.loading === '1') return;
    const gr = this.grid.getBoundingClientRect(), r = tile.getBoundingClientRect();
    if (r.bottom < gr.top - 300 || r.top > gr.bottom + 300) return;
    const item = this.byName.get(tile.dataset.name ?? '');
    if (!item) return;
    tile.dataset.loading = '1';
    try {
      const url = await this.thumbFor(item, d => this.setBadge(tile, d));
      if (!url) throw new Error('no thumb');
      const img = new Image();
      img.draggable = false; img.alt = '';
      img.onload = () => { tile.classList.add('hasimg'); tile.dataset.loaded = '1'; };
      img.onerror = () => tile.classList.add('err');
      img.src = url;
      tile.querySelector('.thumb')?.appendChild(img);
    } catch { tile.classList.add('err'); }
    delete tile.dataset.loading;
  }

  private setBadge(tile: HTMLElement, dur: number): void {
    if (!isFinite(dur) || dur <= 0) return;
    const b = tile.querySelector('.badge');
    if (b) b.textContent = fmtDur(dur);
    const name = tile.dataset.name ?? '';
    tile.title = name + ' · ' + fmtDur(dur);
    const m = this.meta.get(name) ?? {};
    m.dur = dur;
    this.meta.set(name, m);
    saveMetaSoon(this.folderLabel, this.meta);
  }

  private sweepTimer: ReturnType<typeof setTimeout> | null = null;
  private sweepSoon(): void {
    if (this.sweepTimer) return;
    this.sweepTimer = setTimeout(() => { this.sweepTimer = null; this.sweep(); }, 150);
  }
  private sweep(): void {
    if (this.panel.classList.contains('hidden')) return;
    const gr = this.grid.getBoundingClientRect();
    for (const t of this.grid.querySelectorAll<HTMLElement>('.tile')) {
      const r = t.getBoundingClientRect();
      const off = r.bottom < gr.top - 300 || r.top > gr.bottom + 300;
      const img = t.querySelector('img');
      if (off) {
        if (t.dataset.loaded === '1' && img) { img.removeAttribute('src'); t.classList.remove('hasimg'); delete t.dataset.loaded; }
      } else if (t.dataset.loaded !== '1' && !t.classList.contains('err')) {
        if (img && !img.getAttribute('src')) img.remove();
        this.thumbQueue.push(t);
      }
    }
    if (this.grid.scrollTop + this.grid.clientHeight > this.grid.scrollHeight - 400 && this.rendered < this.filtered().length) this.addChunk();
  }

  private startIndexing(): void {
    const gen = ++this.indexGen;
    const todo = this.files.filter(f => !this.meta.has(f.name));
    if (!todo.length) { this.indexing = false; this.updateCount(); return; }
    this.indexing = true;
    let i = 0;
    const step = (): void => {
      if (gen !== this.indexGen) return;
      if (i >= todo.length) {
        this.indexing = false; this.updateCount();
        if (this.filters.dur !== 'all' || this.filters.maxMb !== 'all') this.render();
        return;
      }
      const batch = todo.slice(i, (i += 40));
      Promise.all(batch.map(async f => {
        try { const file = await f.handle.getFile(); this.meta.set(f.name, { ...this.meta.get(f.name), size: file.size, mtime: file.lastModified }); } catch { /* skip */ }
      })).then(() => { if (gen !== this.indexGen) return; saveMetaSoon(this.folderLabel, this.meta); setTimeout(step, 120); });
    };
    step();
  }

  // ------------------------------------------------------------------ attach
  private async attachItem(item: MediaItem, tile: HTMLElement | null): Promise<void> {
    this.stopHover();
    tile?.classList.add('busy');
    try {
      const file = await item.handle.getFile();
      const res = await attachFile(file, this.ctx);
      this.setStatus('✓ Attached ' + item.name + ' to ' + res.label);
      this.toast('Attached ' + item.name);
      focusComposer((res as { target?: Element | null }).target ?? null, this.ctx);
    } catch (err) {
      const e = err as Error;
      this.setStatus('✗ ' + e.message);
      this.toast(e.message);
      if (e.name === 'NotAllowedError') { this.pending = this.dir; this.setState('needPerm'); }
    }
    tile?.classList.remove('busy');
  }

  private async attachRandom(): Promise<void> {
    if (this.state === 'needPick') return this.toast('Pick your media folder first');
    if (this.state === 'needPerm') return this.toast('Reconnect the folder first (orange button)');
    if (this.state === 'loading') return this.toast('Still scanning…');
    const item = pickRandom(this.filtered(), this.recent);
    if (!item) return this.toast('No media files match the current filters');
    this.recent = [...this.recent, item.name].slice(-Math.max(1, Math.min(20, Math.floor(this.filtered().length / 2))));
    await this.attachItem(item, null);
  }

  private toggleQueue(item: MediaItem, tile: HTMLElement): void {
    if (this.queue.has(item.name)) this.queue.delete(item.name);
    else if (this.queue.size >= QUEUE_MAX) return this.toast(`Queue is full (max ${QUEUE_MAX})`);
    else this.queue.add(item.name);
    const on = this.queue.has(item.name);
    tile.classList.toggle('queued', on);
    (tile.querySelector('.qcheck') as HTMLElement).textContent = on ? '✓' : '';
    this.updateQueueBar();
  }

  private updateQueueBar(): void {
    this.q('.qbar').classList.toggle('hidden', this.queue.size === 0);
    this.q('.qcount').textContent = `${this.queue.size} selected (max ${QUEUE_MAX})`;
  }

  private clearQueue(): void {
    this.queue.clear();
    this.root.querySelectorAll('.tile.queued').forEach(t => { t.classList.remove('queued'); (t.querySelector('.qcheck') as HTMLElement).textContent = ''; });
    this.updateQueueBar();
  }

  private async attachQueue(): Promise<void> {
    if (!this.queue.size || this.queueBusy) return;
    this.queueBusy = true;
    try {
      const files: File[] = [];
      for (const n of this.queue) { try { files.push(await (this.byName.get(n) as MediaItem).handle.getFile()); } catch { /* skip */ } }
      if (!files.length) return this.toast('Could not read the selected files');
      let target: Element | null = null;
      let done = 0;
      const input = pickFileInput(document, this.ctx);
      if (input) {
        try {
          const dt = new DataTransfer(); files.forEach(f => dt.items.add(f));
          input.files = dt.files;
          input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true }));
          done = files.length; target = pickTextTarget(document, this.ctx);
        } catch { done = 0; }
      }
      if (!done) {
        for (const f of files) {
          try { const r = await attachFile(f, this.ctx); target = (r as { target?: Element | null }).target ?? target; done++; } catch { /* next */ }
          await new Promise(r => setTimeout(r, 350));
        }
      }
      this.toast(done ? `Attached ${done} file${done === 1 ? '' : 's'}` : 'Could not attach. Click into a message box first');
      if (done) focusComposer(target, this.ctx);
      if (done === files.length) this.clearQueue();
    } finally { this.queueBusy = false; }
  }

  // ------------------------------------------------------------------ shuffle
  private toggleShuffle(): void {
    if (!this.files.length) return this.toast('No files to shuffle yet');
    this.shuffled = !this.shuffled;
    this.files = this.shuffled ? shuffleArray(this.files) : orderFiles(this.files, false);
    this.prefs.shuffled = this.shuffled;
    if (this.shuffled) this.prefs.shuffleOrder = this.files.map(f => f.name); else delete this.prefs.shuffleOrder;
    savePrefs(this.prefs);
    this.q('[data-act="shuffle"]').classList.toggle('accent', this.shuffled);
    this.render();
    this.grid.scrollTop = 0;
    this.toast(this.shuffled ? 'Shuffled · order saved' : 'Back to name order');
  }

  // ------------------------------------------------------------------ lightbox
  private openLightbox(item: MediaItem): void {
    this.stopHover();
    this.lbItem = item;
    const media = this.q('.lbmedia');
    media.replaceChildren();
    if (this.lbUrl) URL.revokeObjectURL(this.lbUrl);
    this.lbUrl = null;
    this.q('.lbname').textContent = item.name;
    const m = this.meta.get(item.name) ?? {};
    this.q('.lbmeta').textContent = (typeof m.dur === 'number' ? fmtDur(m.dur) + ' · ' : '') + (m.size !== undefined ? fmtSize(m.size) : '');
    item.handle.getFile().then(file => {
      if (this.lbItem !== item) return;
      this.lbUrl = URL.createObjectURL(file);
      if (VID_RE.test(item.name)) {
        const v = Object.assign(document.createElement('video'), { src: this.lbUrl, controls: true, loop: true, autoplay: true, playsInline: true });
        media.appendChild(v); v.play().catch(() => undefined);
      } else media.appendChild(Object.assign(new Image(), { src: this.lbUrl, alt: item.name }));
    }).catch(() => undefined);
    this.q('.lb').classList.remove('hidden');
  }
  private closeLightbox(): void {
    this.q('.lb').classList.add('hidden');
    this.q('.lbmedia').replaceChildren();
    if (this.lbUrl) URL.revokeObjectURL(this.lbUrl);
    this.lbUrl = null; this.lbItem = null;
  }
  private lbNav(dir: number): void {
    if (!this.lbItem) return;
    const list = this.filtered();
    const i = list.findIndex(x => x.name === this.lbItem?.name);
    const next = list[(i + dir + list.length) % list.length];
    if (next) this.openLightbox(next);
  }

  // ------------------------------------------------------------------ panel position
  private isOpen = (): boolean => !this.panel.classList.contains('hidden');

  private positionPanel(): void {
    const size = { w: this.panel.offsetWidth || 380, h: this.panel.offsetHeight || 620 };
    const vp = { w: innerWidth, h: innerHeight };
    const fab = rectOf(this.fab);
    const saved = this.prefs.panel?.pos;
    const p = saved ? settlePanel({ left: saved.l, top: saved.t }, size, fab, vp) : anchorPanel(fab, size, vp);
    Object.assign(this.panel.style, { left: Math.round(p.left) + 'px', top: Math.round(p.top) + 'px', right: 'auto', bottom: 'auto' });
  }

  private togglePanel(): void {
    if (this.state === 'needPick' || this.state === 'needPerm') return this.fabClick();
    if (this.isOpen()) { this.closePanel(); return; }
    this.panel.classList.remove('hidden');
    this.positionPanel();
    this.layoutGrid();
    this.sweep();
    if (!this.prefs.resizeTipSeen) {
      this.prefs.resizeTipSeen = true; savePrefs(this.prefs);
      setTimeout(() => this.toast('Tip: drag the bottom-right corner to resize'), 800);
    }
  }
  private closePanel(): void {
    this.stopHover(); this.closeLightbox(); this.tooltip.hide();
    this.q('.menu').classList.add('hidden');
    this.panel.classList.add('hidden');
  }

  private fabClick(): void {
    if (this.state === 'needPick') void this.pickFolder().then(h => (h ? this.useFolder(h) : undefined));
    else if (this.state === 'needPerm') void this.reconnect();
    else this.togglePanel();
  }

  // ------------------------------------------------------------------ events
  private bindEvents(): void {
    // remember the last text box the user focused, even after they click our UI
    document.addEventListener('focusin', e => { const t = e.target as Element; if (t?.nodeType === 1 && isEditable(t, this.host)) this.lastEditable = t; }, true);
    const remember = (): void => {
      const ae = document.activeElement;
      if (ae && ae !== document.body && isEditable(ae, this.host)) this.lastEditable = ae;
    };
    this.host.addEventListener('pointerdown', remember, true);

    this.fab.addEventListener('click', () => this.fabClick());

    // Floating button drag: hide the panel while dragging, bring it back on release.
    makeDraggable(this.fab, {
      onStart: () => { this.tooltip.setSuspended(true); this.panel.classList.add('suspended'); },
      onEnd: ({ moved, left, top }) => {
        this.tooltip.setSuspended(false);
        this.panel.classList.remove('suspended');
        if (!moved) return;
        this.prefs.btn = { pos: { l: Math.round(left), t: Math.round(top) } };
        if (this.prefs.panel) delete this.prefs.panel.pos; // the panel follows the button again
        savePrefs(this.prefs);
        if (this.isOpen()) this.positionPanel();
      },
    });
    // Panel drag: stays visible; on drop it is clamped and kept off the button.
    makeDraggable(this.panel, {
      handle: this.q<HTMLElement>('.hd'),
      ignore: '.ib',
      onStart: () => { this.tooltip.setSuspended(true); this.panel.classList.add('dragging'); this.q('.menu').classList.add('hidden'); },
      onEnd: ({ moved }) => {
        this.tooltip.setSuspended(false);
        this.panel.classList.remove('dragging');
        if (!moved) return;
        const r = rectOf(this.panel);
        const p = settlePanel({ left: r.left, top: r.top }, { w: r.width, h: r.height }, rectOf(this.fab), { w: innerWidth, h: innerHeight });
        Object.assign(this.panel.style, { left: p.left + 'px', top: p.top + 'px' });
        this.prefs.panel = { ...this.prefs.panel, pos: { l: Math.round(p.left), t: Math.round(p.top) } };
        savePrefs(this.prefs);
      },
    });
    this.initResize();

    this.root.addEventListener('click', e => {
      const el = (e.target as Element).closest<HTMLElement>('[data-act]');
      const menu = this.q('.menu');
      if (!el) { if (!(e.target as Element).closest('.menu')) menu.classList.add('hidden'); return; }
      const act = el.dataset.act;
      if (act !== 'more') menu.classList.add('hidden');
      switch (act) {
        case 'random': void this.attachRandom(); break;
        case 'shuffle': this.toggleShuffle(); break;
        case 'select':
          this.selectMode = !this.selectMode;
          el.classList.toggle('accent', this.selectMode);
          this.root.querySelectorAll('.tile').forEach(t => t.classList.toggle('selmode', this.selectMode));
          this.toast(this.selectMode ? `Select mode on · up to ${QUEUE_MAX} files` : 'Select mode off');
          break;
        case 'refresh': void this.rescan(); break;
        case 'more': menu.classList.toggle('hidden'); break;
        case 'close': this.closePanel(); break;
        case 'change': void this.chooseFolder(); break;
        case 'reselect': void this.chooseFolder(); break;
        case 'resetpos': if (this.prefs.panel) delete this.prefs.panel.pos; savePrefs(this.prefs); this.positionPanel(); this.toast('Panel position reset'); break;
        case 'resetfilters': this.resetFilters(); break;
        case 'qattach': void this.attachQueue(); break;
        case 'qclear': this.clearQueue(); break;
        case 'lbclose': this.closeLightbox(); break;
        case 'lbattach': if (this.lbItem) void this.attachItem(this.lbItem, null); break;
        case 'lbprev': this.lbNav(-1); break;
        case 'lbnext': this.lbNav(1); break;
      }
    });
    this.q('.lb').addEventListener('click', e => { if ((e.target as Element).classList.contains('lb')) this.closeLightbox(); });

    this.root.querySelectorAll<HTMLSelectElement>('select.fs').forEach(s => s.addEventListener('change', () => {
      const f = s.dataset.f;
      if (f === 'type') this.filters.type = s.value as Filters['type'];
      else if (f === 'dur') this.filters.dur = s.value as Filters['dur'];
      else if (f === 'max') this.filters.maxMb = s.value as Filters['maxMb'];
      else if (f === 'sort') this.filters.sort = s.value as Filters['sort'];
      this.render();
    }));
    this.q('.search').addEventListener('input', e => { this.filters.query = (e.target as HTMLInputElement).value; this.render(); });
    this.grid.addEventListener('scroll', () => this.sweepSoon(), { passive: true });
    if (typeof ResizeObserver === 'function') new ResizeObserver(() => this.layoutGrid()).observe(this.grid);

    window.addEventListener('keydown', e => {
      if (this.lbItem) {
        if (e.key === 'Escape') { e.preventDefault(); this.closeLightbox(); return; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); this.lbNav(-1); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); this.lbNav(1); return; }
        if (e.key === 'Enter') { e.preventDefault(); void this.attachItem(this.lbItem, null); return; }
      }
      if (e.key === 'Escape' && this.isOpen() && e.composedPath().includes(this.host)) { this.closePanel(); return; }
      if (!e.altKey || !e.shiftKey) return;
      if (e.code === 'KeyR') { e.preventDefault(); void this.attachRandom(); }
      else if (e.code === 'KeyM') { e.preventDefault(); this.togglePanel(); }
      else if (e.code === 'KeyS') { e.preventDefault(); this.toggleShuffle(); }
    });

    window.addEventListener('resize', () => {
      const r = rectOf(this.fab);
      this.placeFab(r.left, r.top);
      if (this.isOpen()) this.positionPanel();
    });
  }

  private initResize(): void {
    const handle = this.q<HTMLElement>('.resize');
    let rs: { sx: number; sy: number; w: number; h: number } | null = null;
    handle.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      const r = this.panel.getBoundingClientRect();
      rs = { sx: e.clientX, sy: e.clientY, w: r.width, h: r.height };
      try { handle.setPointerCapture(e.pointerId); } catch { /* best effort */ }
    });
    handle.addEventListener('pointermove', e => {
      if (!rs) return;
      this.panel.style.width = Math.round(clamp(rs.w + e.clientX - rs.sx, 320, innerWidth - 24)) + 'px';
      this.panel.style.height = Math.round(clamp(rs.h + e.clientY - rs.sy, 360, innerHeight - 24)) + 'px';
    });
    const end = (): void => {
      if (!rs) return;
      rs = null;
      const r = this.panel.getBoundingClientRect();
      this.prefs.panel = { ...this.prefs.panel, w: Math.round(r.width), h: Math.round(r.height) };
      savePrefs(this.prefs);
      this.sweepSoon();
    };
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('lostpointercapture', end);
  }
}

