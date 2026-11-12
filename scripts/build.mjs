import { build, context } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { header } from './header.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const watch = process.argv.includes('--watch');
mkdirSync('dist', { recursive: true });

const options = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  minify: false, // ship readable code (Greasy Fork requires it)
  legalComments: 'none',
  define: { __VERSION__: JSON.stringify(pkg.version), __DEV__: 'false', __DEMO__: 'false' },
  banner: { js: header(pkg) },
  outfile: 'dist/stash-roulette.user.js',
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
  const out = readFileSync(options.outfile, 'utf8');
  writeFileSync(options.outfile, out);
}

if (process.argv.includes('--dev')) {
  await build({ ...options, define: { ...options.define, __DEV__: 'true' }, outfile: 'dist/stash-roulette.dev.js' });
}

if (process.argv.includes('--demo')) {
  // Demo bundle: no userscript header, runs on any host, served next to demo/index.html.
  await build({ ...options, banner: {}, define: { ...options.define, __DEMO__: 'true' }, outfile: 'demo/stash-roulette.demo.js' });
}
