import type { Ledger } from "../accounting/ledger.js";

export function formatSummary(ledger: Ledger): string {
  const s = ledger.summary();
  return `trades=${s.trades} pnl=${s.pnl.toFixed(2)} winRate=${(s.winRate * 100).toFixed(1)}%`;
}

export function maxConsecutiveLosses(pnls: number[]): number {
  let cur = 0;
  let max = 0;
  for (const p of pnls) {
    if (p < 0) {
      cur += 1;
      max = Math.max(max, cur);
    } else cur = 0;
  }
  return max;
}
