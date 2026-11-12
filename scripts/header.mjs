// Generates the ==UserScript== block. Version comes from package.json only.
// The header names no repository URL on purpose: the script is published on
// Greasy Fork without a link to the source repo. Userscript managers update a
// script with no @updateURL/@downloadURL from the URL it was installed from.
export function header(pkg) {
  const lines = [
    ['name', 'Stash Roulette'],
    ['namespace', 'stash-roulette'],
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
    ['compatible', 'chrome'],
    ['compatible', 'edge'],
    ['incompatible', 'firefox No File System Access API'],
    ['incompatible', 'safari No File System Access API'],
    ['run-at', 'document-idle'],
    ['grant', 'GM_getValue'],
    ['grant', 'GM_setValue'],
    ['grant', 'GM_deleteValue'],
  ];
  const w = Math.max(...lines.map(([k]) => k.length));
  return ['// ==UserScript==', ...lines.map(([k, v]) => `// @${k.padEnd(w)}  ${v}`), '// ==/UserScript=='].join('\n');
}
