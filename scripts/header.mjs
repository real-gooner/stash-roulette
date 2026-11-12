// Generates the ==UserScript== block. Version comes from package.json only.
export function header(pkg) {
  const lines = [
    ['name', 'Stash Roulette'],
    ['namespace', pkg.homepage],
    ['version', pkg.version],
    ['description', 'Browse a local media folder with previews and attach a picked or random file to the composer on X and Discord. Files never leave your browser.'],
    ['author', pkg.author],
    ['license', 'MIT'],
    ['match', 'https://x.com/*'],
    ['match', 'https://*.x.com/*'],
    ['match', 'https://twitter.com/*'],
    ['match', 'https://*.twitter.com/*'],
    ['match', 'https://discord.com/*'],
    ['match', 'https://*.discord.com/*'],
    ['run-at', 'document-idle'],
    ['grant', 'GM_getValue'],
    ['grant', 'GM_setValue'],
    ['grant', 'GM_deleteValue'],
    ['homepageURL', pkg.homepage],
    ['supportURL', pkg.bugs.url],
    ['downloadURL', pkg.homepage + '/releases/latest/download/stash-roulette.user.js'],
    ['updateURL', pkg.homepage + '/releases/latest/download/stash-roulette.user.js'],
  ];
  const w = Math.max(...lines.map(([k]) => k.length));
  return ['// ==UserScript==', ...lines.map(([k, v]) => `// @${k.padEnd(w)}  ${v}`), '// ==/UserScript=='].join('\n');
}
