# Changelog

All notable changes are listed here. Format: [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

## [Unreleased]

## [0.9.1] - 2026-11-12

### Added
- `@compatible` / `@incompatible` header lines so script sites show that only Chrome and Edge are supported.

### Changed
- The header no longer contains `@homepageURL`, `@supportURL`, `@updateURL` or `@downloadURL`. Script managers keep updating from the URL the script was installed from.
- `@namespace` is now `stash-roulette`. Script managers treat this as a new script: remove the old copy after installing. The chosen folder is kept; layout and shuffle settings start fresh.

## [0.9.0] - 2026-11-12

First public version under the new name.

### Changed
- Complete rewrite in TypeScript with a tested module structure. Renamed from "X Random Media Picker" to **Stash Roulette**.
- Toolbar reordered by use: Random, Shuffle and Select first; Rescan next; folder and position actions moved into a ⋯ menu.
- Filters shown as compact chips with a one-click Reset; designed empty and no-match states.
- Preferences now live in the userscript manager's storage instead of the site's localStorage.
- Random no longer repeats recent picks.

### Fixed
- Panel could be dragged behind the circle button and become hard to grab: the panel now hides while the button is dragged, and is kept off the button and inside the window when dropped.
- Hover tooltips were cut off near the panel edges: tooltips now render in their own layer and stay inside the window.
- The dragged panel position is now remembered (Reset position in the ⋯ menu).
- A cancelled drag no longer leaves a stuck drag state.
- Preview button was nested inside a button, which broke keyboard and screen-reader use.

### Security / privacy
- Files are only passed to frames on x.com, twitter.com and discord.com, addressed to the exact origin. Previously they were posted to every iframe on the page.
- Debug logging off by default and never records file names; the in-panel log and diagnostics were removed.
- No globals are exposed to the page.

### Migration
- A folder chosen with the old script is picked up automatically. Old preferences are imported once.
