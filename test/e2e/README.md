# Browser smoke test (manual, mock composer)

The real sites need a login, so the browser check uses `mock.html`: a page with an X-style composer (`data-testid="tweetTextarea_0"` plus a hidden file input) and a fake media folder created in the browser's origin-private file system.

```bash
npm run build:dev            # writes dist/stash-roulette.dev.js (treats localhost as X)
python3 -m http.server 8765  # from the repo root
# open http://localhost:8765/test/e2e/mock.html, then in the console:
```

`smoke.js` creates 30 PNGs, stubs `showDirectoryPicker`, injects the dev bundle, then checks: panel opens, thumbnails load, clicking a tile attaches to the composer, Random attaches, dragging the circle hides the panel and brings it back, and the panel never overlaps the circle.

Last run: 2026-11-12, Chromium (built-in browser pane), all checks passed. Not yet run on x.com or discord.com, in Tampermonkey, or in Violentmonkey.
