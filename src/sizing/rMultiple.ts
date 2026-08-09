export function sizeUsd(equity: number, riskPct: number, stopPct: number): number {
  const riskUsd = equity * (riskPct / 100);
  const stop = Math.max(stopPct, 0.05) / 100;
  return Math.min(riskUsd / stop, equity * 0.25);
}
