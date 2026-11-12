// Paste into the console of mock.html after `npm run build:dev` and a local http server.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle('mock-media', { create: true });
  const colors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];
  for (let i = 0; i < 30; i++) {
    const c = document.createElement('canvas'); c.width = 400; c.height = 300 + (i % 3) * 60;
    const g = c.getContext('2d'); g.fillStyle = colors[i % 6]; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#fff'; g.font = '80px sans-serif'; g.fillText('#' + i, 40, 160);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const fh = await dir.getFileHandle('pic-' + String(i).padStart(2, '0') + '.png', { create: true });
    const w = await fh.createWritable(); await w.write(blob); await w.close();
  }
  window.showDirectoryPicker = async () => dir;
  (0, eval)(await (await fetch('/dist/stash-roulette.dev.js?' + Date.now())).text());
  await wait(600);
  const sr = document.getElementById('stash-roulette-root').shadowRoot;
  const fab = sr.querySelector('.fab'), panel = sr.querySelector('.panel');
  const ok = {};
  if (fab.classList.contains('pick')) { fab.click(); await wait(1500); }
  if (panel.classList.contains('hidden')) fab.click();
  await wait(2500);
  const tiles = [...sr.querySelectorAll('.tile')];
  ok.thumbnailsLoaded = tiles.filter(t => t.classList.contains('hasimg')).length > 0 && !tiles.some(t => t.classList.contains('err'));
  document.querySelector('[data-testid="tweetTextarea_0"]').focus();
  tiles[3].click(); await wait(800);
  ok.tileAttach = /pic-03\.png/.test(document.getElementById('out').textContent);
  sr.querySelector('[data-act="random"]').click(); await wait(800);
  ok.randomAttach = /attached: pic-/.test(document.getElementById('out').textContent);
  const r = fab.getBoundingClientRect();
  const ev = (t, x, y) => fab.dispatchEvent(new PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 11, button: 0, clientX: x, clientY: y, pointerType: 'mouse' }));
  const cx = r.left + 25, cy = r.top + 25;
  ev('pointerdown', cx, cy); ev('pointermove', cx - 30, cy - 30);
  ok.panelHiddenWhileDragging = getComputedStyle(panel).visibility === 'hidden';
  ev('pointermove', cx - 400, cy - 300); ev('pointerup', cx - 400, cy - 300); await wait(300);
  const fr = fab.getBoundingClientRect(), pr = panel.getBoundingClientRect();
  ok.panelBackAfterDrag = getComputedStyle(panel).visibility === 'visible';
  ok.panelNotOnButton = !(pr.left < fr.right && pr.right > fr.left && pr.top < fr.bottom && pr.bottom > fr.top);
  ok.panelInViewport = pr.left >= 0 && pr.top >= 0 && pr.right <= innerWidth && pr.bottom <= innerHeight;
  console.table(ok);
  return ok;
})();
