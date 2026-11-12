// Layer order lives here, in one place: fab < panel < tip < toast.
export const Z = { fab: 2147483644, panel: 2147483645, tip: 2147483646, toast: 2147483647 };

export const css = /* css */ `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
.fab { position: fixed; right: 14px; bottom: 14px; width: 50px; height: 50px; border-radius: 50%; border: none; cursor: pointer; padding: 0;
  background: linear-gradient(145deg, #2aa7f7, #7c4dff); color: #fff; z-index: ${Z.fab};
  box-shadow: 0 6px 20px rgba(12,120,220,.45), 0 2px 6px rgba(0,0,0,.4); display: flex; align-items: center; justify-content: center;
  user-select: none; touch-action: none; transition: transform .15s cubic-bezier(.2,.9,.3,1.4), box-shadow .2s; }
.fab svg { width: 22px; height: 22px; }
.fab:hover { transform: translateY(-1px) scale(1.06); }
.fab:active { transform: scale(.96); }
.fab.perm { background: linear-gradient(145deg, #f7b733, #f0641e); }
.fab.pick { background: linear-gradient(145deg, #34d399, #1d9bf0); }
.fab.spin svg { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.panel { position: fixed; right: 14px; bottom: 76px; width: min(384px, calc(100vw - 28px)); height: min(72vh, 640px); min-width: 320px; min-height: 360px;
  background: linear-gradient(180deg, #10161d, #0c1117); border: 1px solid rgba(255,255,255,.09); border-radius: 18px;
  box-shadow: 0 30px 70px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.06);
  z-index: ${Z.panel}; display: flex; flex-direction: column; overflow: hidden; color: #e7e9ea; animation: pop .18s cubic-bezier(.2,.9,.3,1.2); }
.panel.hidden { display: none; }
/* hidden (not closed) while the floating button is being dragged */
.panel.suspended { visibility: hidden; }
.panel.dragging { animation: none; }
@keyframes pop { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
.hd { display: flex; align-items: center; gap: 4px; padding: 10px 10px 8px 12px; border-bottom: 1px solid rgba(255,255,255,.06); cursor: grab; user-select: none; touch-action: none; }
.hd:active { cursor: grabbing; }
.logo { width: 28px; height: 28px; border-radius: 9px; flex: none; margin-right: 4px; background: linear-gradient(145deg, #2aa7f7, #7c4dff); color: #fff; display: flex; align-items: center; justify-content: center; }
.logo svg { width: 16px; height: 16px; }
.ttl { flex: 1; font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
.ib { position: relative; background: transparent; border: none; color: #8b98a5; border-radius: 9px; width: 32px; height: 32px; cursor: pointer; flex: none; padding: 0; display: flex; align-items: center; justify-content: center; transition: background .13s, color .13s, transform .1s; }
.ib svg { width: 16px; height: 16px; }
.ib:hover { background: rgba(255,255,255,.08); color: #e7e9ea; }
.ib:active { transform: scale(.94); }
.ib:disabled { opacity: .3; cursor: default; pointer-events: none; }
.ib:focus-visible, .tile:focus-visible, .mi:focus-visible { outline: 2px solid rgba(29,155,240,.7); outline-offset: 1px; }
.ib.accent { background: rgba(29,155,240,.16); color: #4db5f5; }
.ib.accent:hover { background: rgba(29,155,240,.26); }
.sep { width: 1px; height: 18px; background: rgba(255,255,255,.08); margin: 0 3px; flex: none; }
/* tooltip: lives in the shadow root, outside the clipped panel */
.tip { position: fixed; z-index: ${Z.tip}; display: none; pointer-events: none; background: rgba(18,24,31,.98); border: 1px solid rgba(255,255,255,.14); color: #e7e9ea; font-size: 11.5px; font-weight: 500; padding: 5px 9px; border-radius: 7px; white-space: nowrap; max-width: calc(100vw - 16px); box-shadow: 0 8px 20px rgba(0,0,0,.45); }
.tip.on { display: block; }
.tip kbd { margin-left: 8px; color: #8b98a5; font: inherit; font-size: 10.5px; }
.menu { position: absolute; top: 48px; right: 8px; z-index: 30; min-width: 220px; padding: 6px; background: rgba(18,24,31,.98); border: 1px solid rgba(255,255,255,.14); border-radius: 12px; box-shadow: 0 14px 34px rgba(0,0,0,.5); }
.menu.hidden { display: none; }
.mi { display: flex; align-items: center; gap: 10px; width: 100%; background: none; border: none; color: #e7e9ea; font-size: 12.5px; padding: 8px 10px; border-radius: 8px; cursor: pointer; text-align: left; }
.mi:hover { background: rgba(255,255,255,.08); }
.mi svg { width: 15px; height: 15px; color: #8b98a5; flex: none; }
.searchwrap { position: relative; padding: 10px 12px 6px; }
.searchIcon { position: absolute; left: 24px; top: 21px; width: 14px; height: 14px; color: #6b7785; pointer-events: none; }
.search { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; color: #e7e9ea; padding: 8px 12px 8px 34px; font-size: 12.5px; outline: none; }
.search::placeholder { color: #6b7785; }
.search:focus { border-color: rgba(29,155,240,.55); background: rgba(255,255,255,.07); }
.filters { display: flex; gap: 6px; padding: 4px 12px 8px; border-bottom: 1px solid rgba(255,255,255,.05); overflow-x: auto; align-items: center; }
.filters::-webkit-scrollbar { display: none; }
select.fs { flex: none; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); color: #c9d1d9; border-radius: 999px; padding: 5px 10px; font-size: 11px; outline: none; cursor: pointer; max-width: 128px; }
select.fs.on { border-color: rgba(29,155,240,.6); color: #7cc7f9; }
select.fs:hover { background: rgba(255,255,255,.09); }
.reset { flex: none; background: none; border: none; color: #4db5f5; font-size: 11px; cursor: pointer; padding: 4px 6px; }
.reset.hidden { display: none; }
.countbar { padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,.05); font-size: 10.5px; color: #6b7785; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.grid { flex: 1; min-height: 120px; overflow-y: auto; padding: 6px; display: grid; justify-content: center; gap: 6px; align-content: start; }
.grid::-webkit-scrollbar { width: 10px; }
.grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
.empty { grid-column: 1 / -1; text-align: center; color: #8b98a5; font-size: 12.5px; padding: 40px 20px; line-height: 1.5; }
.empty b { display: block; color: #e7e9ea; font-size: 14px; margin-bottom: 6px; }
.empty button { margin-top: 12px; }
.tile { position: relative; width: 100%; height: 100%; background: #131a21; border: 1px solid rgba(255,255,255,.06); border-radius: 12px; overflow: hidden; cursor: pointer; padding: 0; display: block; color: #e7e9ea; min-width: 0; transition: border-color .14s, box-shadow .14s; }
.tile:hover { border-color: rgba(29,155,240,.6); box-shadow: 0 6px 18px rgba(0,0,0,.35); }
.tile.busy { opacity: .45; pointer-events: none; }
.thumb { position: absolute; inset: 0; background: #18202a; overflow: hidden; }
.thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.hovervid { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; background: #000; }
.tile:not(.hasimg):not(.err) .thumb { background: linear-gradient(100deg, #151d26 40%, #1d2833 50%, #151d26 60%); background-size: 200% 100%; animation: shimmer 1.5s linear infinite; }
@keyframes shimmer { from { background-position: 130% 0; } to { background-position: -130% 0; } }
.ph { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,.22); pointer-events: none; }
.ph svg { width: 26px; height: 26px; }
.tile.hasimg .ph { display: none; }
.tile.err .ph svg { display: none; }
.tile.err .ph::after { content: '⚠'; font-size: 20px; color: rgba(255,255,255,.4); }
.meta { position: absolute; inset: auto 0 0 0; padding: 22px 8px 7px; background: linear-gradient(transparent, rgba(0,0,0,.82)); opacity: 0; transition: opacity .15s; pointer-events: none; z-index: 2; }
.tile:hover .meta, .tile:focus-visible .meta { opacity: 1; }
.nm { font-size: 10px; color: rgba(255,255,255,.92); display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge { position: absolute; right: 6px; bottom: 6px; z-index: 3; background: rgba(0,0,0,.68); color: #fff; font-size: 10px; font-weight: 600; border-radius: 6px; padding: 2px 6px; pointer-events: none; font-variant-numeric: tabular-nums; }
.qcheck { position: absolute; top: 6px; left: 6px; z-index: 4; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,.55); color: #fff; font-size: 12px; font-weight: 700; display: none; align-items: center; justify-content: center; border: 1px solid rgba(255,255,255,.4); }
.tile.queued { border-color: #1d9bf0; box-shadow: 0 0 0 2px rgba(29,155,240,.45); }
.tile.queued .qcheck { display: flex; background: #1d9bf0; border-color: transparent; }
.tile.selmode .qcheck { display: flex; }
.chip { position: absolute; top: 6px; right: 6px; z-index: 4; width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0; background: rgba(29,155,240,.92); color: #fff; display: none; align-items: center; justify-content: center; cursor: pointer; }
.cell { position: relative; }
.cell:hover .chip, .cell:focus-within .chip { display: flex; }
.chip svg { width: 13px; height: 13px; }
.ft { padding: 8px 30px 8px 12px; border-top: 1px solid rgba(255,255,255,.06); font-size: 11px; color: #6b7785; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.qbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-top: 1px solid rgba(29,155,240,.35); background: rgba(29,155,240,.08); }
.qbar.hidden { display: none; }
.qcount { flex: 1; font-size: 12px; color: #7cc7f9; font-weight: 600; }
.btn { background: #1d9bf0; border: none; color: #fff; border-radius: 8px; padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn:hover { background: #1a8cd8; }
.btn.ghost { background: rgba(255,255,255,.1); color: #e7e9ea; }
.resize { position: absolute; right: 0; bottom: 0; width: 26px; height: 26px; cursor: nwse-resize; z-index: 5; touch-action: none; }
.resize::after { content: ''; position: absolute; right: 5px; bottom: 5px; width: 12px; height: 12px; background: linear-gradient(135deg, transparent 0 40%, rgba(255,255,255,.45) 40% 48%, transparent 48%), linear-gradient(135deg, transparent 0 60%, rgba(255,255,255,.35) 60% 68%, transparent 68%); }
.toasts { position: fixed; left: 50%; bottom: 86px; transform: translateX(-50%); z-index: ${Z.toast}; display: flex; flex-direction: column; gap: 8px; align-items: center; pointer-events: none; }
.toast { max-width: 78vw; background: rgba(20,26,33,.92); border: 1px solid rgba(255,255,255,.1); color: #e7e9ea; border-radius: 12px; padding: 10px 14px; font-size: 12.5px; box-shadow: 0 12px 32px rgba(0,0,0,.45); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; transition: opacity .25s; }
.lb { position: absolute; inset: 0; z-index: 40; background: rgba(5,8,12,.92); display: flex; flex-direction: column; }
.lb.hidden { display: none; }
.lbmedia { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 14px; }
.lbmedia img, .lbmedia video { max-width: 100%; max-height: 100%; border-radius: 12px; }
.lbinfo { padding: 4px 16px 2px; text-align: center; }
.lbname { font-size: 12px; word-break: break-all; }
.lbmeta { font-size: 11px; color: #8b98a5; margin-top: 2px; }
.lbcontrols { display: flex; gap: 8px; justify-content: center; padding: 10px 16px 14px; }
.lbbtn { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); color: #e7e9ea; border-radius: 10px; padding: 8px 14px; font-size: 13px; cursor: pointer; min-width: 44px; }
.lbbtn.primary { background: #1d9bf0; border-color: transparent; font-weight: 600; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
`;
