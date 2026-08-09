export type LedgerEntry = {
  ts: number;
  action: string;
  reason: string;
  pnlUsd: number;
  equity: number;
  feeUsd?: number;
  tag?: string;
};

export class Ledger {
  readonly entries: LedgerEntry[] = [];

  push(e: LedgerEntry): void {
    this.entries.push(e);
  }

  realizedPnl(): number {
    return this.entries.reduce((s, e) => s + e.pnlUsd, 0);
  }

  winRate(): number {
    const trades = this.entries.filter((e) => e.action === "buy" || e.action === "sell");
    if (!trades.length) return 0;
    const wins = trades.filter((e) => e.pnlUsd > 0).length;
    return wins / trades.length;
  }

  summary(): { trades: number; pnl: number; winRate: number } {
    const trades = this.entries.filter((e) => e.action === "buy" || e.action === "sell").length;
    return { trades, pnl: this.realizedPnl(), winRate: this.winRate() };
  }
}
