# Site adapters

An adapter (`src/attach/adapters/*.ts`) tells the attach engine how to find a site's composer:

- `composerSelector`: containers that wrap a composer (used to pick the right hidden file input)
- `textboxSelectors`: text boxes, most specific first (used for paste and drop, and to return the caret)
- `label()`: a human label for where the file went

## When attaching breaks after a site update

1. On the site, focus the message box and run in the console: `document.querySelectorAll('input[type=file], [contenteditable], [role=textbox], textarea')` to see what exists now.
2. Update the selectors in the adapter. Prefer stable attributes (`data-testid`, `role`) over class names.
3. Add a fixture or test case in `test/engine.test.ts` that mirrors the new structure.
4. Add a line to the changelog.
