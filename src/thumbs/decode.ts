import { THUMB_PX } from '../config';

const toBlob = (c: HTMLCanvasElement, q: number): Promise<Blob | null> =>
  new Promise(res => c.toBlob(b => res(b), 'image/jpeg', q));

export function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('timeout: ' + msg)), ms);
    p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); });
  });
}

/** Decode a photo once into a small JPEG so tiles never hold full-size bitmaps. */
export async function imageThumb(file: File): Promise<string | null> {
  try {
    const bmp = await createImageBitmap(file, { resizeWidth: THUMB_PX, resizeQuality: 'low' });
    if (bmp.width > 0) {
      const c = document.createElement('canvas');
      c.width = bmp.width; c.height = bmp.height;
      c.getContext('2d')?.drawImage(bmp, 0, 0);
      bmp.close?.();
      const blob = await toBlob(c, 0.72);
      if (blob && blob.size > 400) return URL.createObjectURL(blob);
    }
  } catch { /* fall through to the <img> path */ }
  const raw = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = raw;
    await withTimeout(new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('decode')); }), 8000, 'image');
    const scale = Math.min(1, THUMB_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * scale));
    c.height = Math.max(1, Math.round(img.naturalHeight * scale));
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height);
    const blob = await toBlob(c, 0.72);
    if (!blob || blob.size < 400) throw new Error('empty');
    URL.revokeObjectURL(raw);
    return URL.createObjectURL(blob);
  } catch {
    return raw; // last resort: the full image URL
  }
}

/** Grab a frame near the start; report the duration through onMeta. */
export async function videoThumb(file: File, onMeta?: (dur: number) => void): Promise<string | null> {
  let url: string;
  try { url = URL.createObjectURL(file); } catch { return null; }
  try {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url;
    await withTimeout(new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error('load')); }), 8000, 'video');
    let dur = v.duration;
    if ((!isFinite(dur) || dur <= 0) && onMeta) {
      // some fragmented MP4s report Infinity until seeked to the end
      await new Promise<void>(r => { v.onseeked = () => r(); v.onerror = () => r(); setTimeout(r, 1200); v.currentTime = 1e7; });
      dur = v.duration;
      if ((!isFinite(dur) || dur <= 0) && isFinite(v.currentTime) && v.currentTime > 0) dur = v.currentTime;
    }
    if (onMeta && isFinite(dur) && dur > 0) onMeta(dur);
    if (!v.videoWidth) throw new Error('no frame');
    v.currentTime = Math.min(0.5, (v.duration || 0.6) / 2);
    await new Promise<void>(r => { v.onseeked = () => r(); v.onerror = () => r(); setTimeout(r, 800); });
    const w = Math.min(THUMB_PX, v.videoWidth);
    const h = Math.max(1, Math.round((w * v.videoHeight) / v.videoWidth));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d')?.drawImage(v, 0, 0, w, h);
    const blob = await toBlob(c, 0.62);
    v.removeAttribute('src'); v.load();
    return blob ? URL.createObjectURL(blob) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
