# Contributing

Thanks for helping. Small, focused pull requests are easiest to review.

## Setup

```bash
npm install
npm run check      # typecheck + lint + tests + build, run this before pushing
npm run dev        # rebuild on change
npm run build:dev  # dev bundle for the mock page (see test/e2e/README.md)
```

Node 20 or newer. Source is TypeScript in `src/`; the build outputs one readable `dist/stash-roulette.user.js` (no minification, so reviewers and script hosts can read it).

## Guidelines

- Keep site-specific selectors inside `src/attach/adapters/`. See [docs/SITE-ADAPTERS.md](docs/SITE-ADAPTERS.md).
- Put logic in pure functions where you can and add a test in `test/`.
- Never log file names or paths. Never add network requests, analytics or remote code.
- UI changes: include a screenshot, and check keyboard use and light/dark.
- Update `CHANGELOG.md` under **Unreleased**.

## Reporting a broken site

X and Discord change often. Include the site, page (timeline, reply, DM, channel), browser, userscript manager, script version, and what happened.
