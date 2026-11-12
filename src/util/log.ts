declare function GM_getValue<T>(key: string, def?: T): T;
const enabled = (): boolean => {
  try { return typeof GM_getValue === 'function' && GM_getValue<boolean>('debug', false) === true; } catch { return false; }
};
/** Off by default. Never pass file names or paths to this. */
export const log = (...a: unknown[]): void => { if (enabled()) console.debug('[stash-roulette]', ...a); };
