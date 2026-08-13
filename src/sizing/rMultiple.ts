/** Price stop unit in percent of mid (1R). Used by sizing and TP/SL. */
export const STOP_UNIT_PCT = 0.4;

export function sizeUsd(equity: number, riskPct: number, stopPct: number, maxPositionUsd?: number): number {
  const riskUsd = equity * (riskPct / 100);
  const stop = Math.max(stopPct, 0.05) / 100;
  const raw = riskUsd / stop;
  const cap = maxPositionUsd ?? equity * 0.25;
  return Math.min(raw, cap);
}
