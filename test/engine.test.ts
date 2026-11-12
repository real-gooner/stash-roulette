import { beforeEach, describe, expect, it, vi } from 'vitest';
import { attachFileToComposer, type AttachCtx } from '../src/attach/engine';
import { xAdapter } from '../src/attach/adapters/x';
import { isTrustedOrigin, siteForHost } from '../src/config';

class FakeDT { items = { add: vi.fn() }; files = ['F'] as unknown as FileList; }
beforeEach(() => {
  document.body.innerHTML = '';
  (window as unknown as { DataTransfer: unknown }).DataTransfer = FakeDT;
  (window as unknown as { ClipboardEvent: unknown }).ClipboardEvent = class extends Event { constructor(t: string, i: EventInit) { super(t, i); } };
  (window as unknown as { DragEvent: unknown }).DragEvent = class extends Event { constructor(t: string, i: EventInit) { super(t, i); } };
});
const host = document.createElement('div');
const ctx = (): AttachCtx => ({ adapter: xAdapter, host, lastFocusedEditable: () => null, log: () => undefined });
const file = new File(['x'], 'a.png');

describe('attachFileToComposer', () => {
  it('uses the hidden file input when present', () => {
    document.body.innerHTML = '<div data-testid="tweetCompose"><div data-testid="tweetTextarea_0" contenteditable="true"></div><input type="file"></div>';
    const input = document.querySelector('input') as HTMLInputElement;
    const onChange = vi.fn(); input.addEventListener('change', onChange);
    Object.defineProperty(input, 'files', { set: vi.fn(), configurable: true });
    expect(attachFileToComposer(file, document, ctx()).method).toBe('file input');
    expect(onChange).toHaveBeenCalled();
  });
  it('falls back to paste on a text box', () => {
    document.body.innerHTML = '<div data-testid="dmComposerTextInput" contenteditable="true"></div>';
    const box = document.querySelector('[contenteditable]') as HTMLElement;
    const onPaste = vi.fn(); box.addEventListener('paste', onPaste);
    const res = attachFileToComposer(file, document, ctx());
    expect(res.method).toBe('paste'); expect(res.label).toBe('DM chat'); expect(onPaste).toHaveBeenCalled();
  });
  it('throws a clear error when no composer exists', () => {
    expect(() => attachFileToComposer(file, document, ctx())).toThrow(/No composer found/);
  });
  it('never targets our own UI', () => {
    const h = document.createElement('div'); h.innerHTML = '<textarea></textarea>'; document.body.append(h);
    expect(() => attachFileToComposer(file, document, { ...ctx(), host: h })).toThrow();
  });
});

describe('origin allowlist', () => {
  it('accepts only https X and Discord origins', () => {
    expect(isTrustedOrigin('https://x.com')).toBe(true);
    expect(isTrustedOrigin('https://chat.x.com')).toBe(true);
    expect(isTrustedOrigin('https://discord.com')).toBe(true);
    expect(isTrustedOrigin('http://x.com')).toBe(false);
    expect(isTrustedOrigin('https://x.com.evil.test')).toBe(false);
    expect(isTrustedOrigin('https://ads.example.com')).toBe(false);
    expect(isTrustedOrigin('null')).toBe(false);
  });
  it('maps hosts to sites', () => {
    expect(siteForHost('twitter.com')).toBe('x');
    expect(siteForHost('notx.com')).toBeNull();
  });
});
