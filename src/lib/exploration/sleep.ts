/** Time-only mock calculation, no storage or health interpretation. */
export function sleepMinutes(bed: string, wake: string): number | undefined {
  if (!/^\d{2}:\d{2}$/.test(bed) || !/^\d{2}:\d{2}$/.test(wake)) return undefined;
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  if (bh === undefined || bm === undefined || wh === undefined || wm === undefined || bh > 23 || wh > 23 || bm > 59 || wm > 59) return undefined;
  return (wh * 60 + wm - bh * 60 - bm + 1440) % 1440;
}