export function fmtDur(d: number): string {
  const total = Math.max(1, Math.round(d));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return mm + ':' + String(ss).padStart(2, '0');
}
export function fmtSize(b: number): string {
  if (!isFinite(b) || b < 0) return '';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
