import { MEDIA_RE } from '../config';
import type { MediaItem } from '../types';
import { byName } from './filter-sort';

type IterableDir = FileSystemDirectoryHandle & {
  entries?: () => AsyncIterable<[string, FileSystemHandle]>;
  keys?: () => AsyncIterable<string>;
};

export async function scanFolder(handle: FileSystemDirectoryHandle): Promise<MediaItem[]> {
  const dir = handle as IterableDir;
  const out: MediaItem[] = [];
  if (typeof dir.entries === 'function') {
    for await (const [name, entry] of dir.entries()) {
      if (entry.kind === 'file' && MEDIA_RE.test(name)) out.push({ name, handle: entry as FileSystemFileHandle });
    }
  } else if (typeof dir.keys === 'function') {
    for await (const name of dir.keys()) {
      if (!MEDIA_RE.test(name)) continue;
      try {
        out.push({ name, handle: await handle.getFileHandle(name) });
      } catch {
        /* file vanished mid-scan */
      }
    }
  }
  return out.sort(byName);
}
