# Architecture

One entry (`src/main.ts`) boots an `App` in the top frame, or a message listener in iframes.

```
src/
  main.ts            boot: site detection, top frame vs iframe
  config.ts          constants, site and origin allowlist
  types.ts
  library/           scan.ts, filter-sort.ts (pure: filter, sort, shuffle, random)
  storage/           idb.ts (folder handle), prefs.ts (userscript storage), meta-cache.ts
  thumbs/            decode.ts, lru.ts, queue.ts (3 decodes at a time)
  attach/            engine.ts (input -> paste -> drop), frames.ts, bridge.ts, adapters/
  ui/                app.ts (controller), template.ts, styles.ts, icons.ts,
                     drag.ts, tooltip.ts, geometry.ts (pure placement maths)
  util/              format.ts, log.ts
```

## Flow

1. Folder handle is restored from IndexedDB, or the user picks one (File System Access API).
2. `scanFolder` lists media; metadata (size, date, duration) is indexed in the background and cached.
3. The grid renders 60 tiles at a time; thumbnails are decoded lazily through a small queue and kept in an LRU of blob URLs.
4. Attach: read the `File`, then try the page, same-origin frames, open shadow roots, and finally trusted-origin frames, using a hidden file input, then a synthetic paste, then a synthetic drop.

## Design rules

- Everything that knows a site's DOM lives in `attach/adapters/`.
- Layers (button, panel, tooltip, toast) have a fixed z-order defined in `ui/styles.ts`.
- Tooltips live outside the clipped panel and are positioned by `geometry.placeTooltip`.
- Dragging is a state machine (`ui/drag.ts`) that handles pointerup, pointercancel and lost capture.
- Messages between frames are limited to https x.com, twitter.com and discord.com origins and always name the target origin.
