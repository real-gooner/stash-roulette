import { listenInFrame } from './attach/bridge';
import { adapterFor } from './attach/adapters';
import { HOST_ID, siteForHost } from './config';
import { App } from './ui/app';

declare const __VERSION__: string;

(function boot(): void {
  const site = siteForHost(location.hostname);
  if (!site) return;
  const isTop = window.top === window.self;

  if (!isTop) {
    // Frames (e.g. the XChat page) get no UI. They only accept a file from a trusted ancestor.
    const dummyHost = document.createElement('div');
    listenInFrame({ adapter: adapterFor(site), host: dummyHost, lastFocusedEditable: () => null, log: () => undefined });
    return;
  }
  // A newer copy already injected its UI: do nothing. Older stale UI is replaced.
  const existing = document.getElementById(HOST_ID);
  if (existing) existing.remove();

  void new App(site).start().catch(err => console.error('[stash-roulette] failed to start', (err as Error).message, __VERSION__));
})();
