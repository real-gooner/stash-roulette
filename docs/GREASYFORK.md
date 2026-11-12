# Greasy Fork listing

How Stash Roulette is listed on [Greasy Fork](https://greasyfork.org) and kept in sync with releases. This file is for maintainers; it is not part of the script.

**The listing does not link to the source repository.** Nothing a Greasy Fork visitor can see (description, code, header) names the repo. Keep it that way: no repo URLs in `scripts/header.mjs`, in the bundled code, or in `greasyfork-description.md`.

## Listing text

| Field | Value |
|---|---|
| Name | `Stash Roulette` (from `@name`) |
| Short description | From `@description` in [`scripts/header.mjs`](../scripts/header.mjs) (158 characters). Greasy Fork always takes it from the script, so change it there. |
| Additional info | [`greasyfork-description.md`](greasyfork-description.md), Markdown, pasted by hand |
| Screenshot | [`images/demo.jpg`](images/demo.jpg) (800×600, demo page with generated sample tiles only, no EXIF) |
| License | MIT (`@license MIT`) |
| Support | The listing's **Feedback** tab (there is no `@supportURL`) |
| Adult content | No. The script targets x.com and discord.com and ships no media. |

## Header choices

Checked against the Greasy Fork source (`greasyfork-org/greasyfork`, November 2026):

- `@updateURL`, `@downloadURL`, `@installURL` are removed from the code Greasy Fork serves and shows (`ScriptVersion#calculate_rewritten_code`), so Greasy Fork installs update from Greasy Fork. The version **diff** page, however, shows the original uploaded code, so these keys are left out of the header entirely. Tampermonkey and Violentmonkey update a script without them from the URL it was installed from, so a copy installed straight from a release file still updates.
- `@supportURL` would be shown as a link on the listing and Feedback pages. Left out.
- `@homepageURL` is not shown in the page UI but is visible on the Code tab. Left out.
- `@namespace` is visible on the Code tab, in the install button's data and in the public JSON API. It is the neutral `stash-roulette`. Do not change it again: Greasy Fork warns when it changes and script managers treat a new namespace as a different script.
- `@compatible chrome`, `@compatible edge`, `@incompatible firefox`, `@incompatible safari` show browser icons on the listing.

## How sync works

- The sync URL is set in Greasy Fork's sync settings, not in the header. It is shown only to the script's author (sync settings and the post-version form), not on the public listing, code page or JSON API.
- **Code** syncs from the latest release asset with sync type **Automatic**. Greasy Fork re-checks automatic scripts about every 12 hours, so a new `v*` tag reaches the listing within half a day. Use **Sync now** on the Admin page to update sooner.
- **Webhook sync does not work with this URL.** Greasy Fork's webhook reads files from the git tree at the pushed commit or release tag, not release assets, and `dist/` is not committed. Use Automatic.
- **Additional info**: paste `greasyfork-description.md` by hand and re-paste after edits. (Greasy Fork can also sync it from a raw URL; that URL is not shown to visitors, but pasting keeps the listing independent of the repo.)
- Every release must bump `@version` (from `package.json`); Greasy Fork warns on changed code with the same version.
- Code stays unminified (`minify: false` in `scripts/build.mjs`); Greasy Fork does not allow minified or obfuscated code.

## First-time setup

Keep the account anonymous: sign in with the project's anonymous GitHub account, never a personal Google or email login. Keep the profile name, about text and website empty or neutral, then open the public profile page while signed out and check it shows no GitHub link.

1. Release a version whose header has no repo URLs (0.9.1 or later). 0.9.0 still names the repo and must not be imported.
2. Go to greasyfork.org → **Sign in** → **GitHub**.
3. Your user page → **Post a script** → **Import**. Paste the latest release asset URL (`…/releases/latest/download/stash-roulette.user.js`), choose sync type **Automatic**, and import.
4. Check the import: name, version, `@match` list, license MIT, browser icons, no "minified" warning, and no repo URL anywhere on the Code tab.
5. Edit the script → **Additional info**: paste `greasyfork-description.md`, markup **Markdown**.
6. **Admin** → Screenshots: upload `docs/images/demo.jpg`.
7. Leave "Adult content" unchecked.

## After a release

Nothing to do. Within about 12 hours the listing shows the new version.
