import type { Settings } from "../config/schema.js";
import type { Broker } from "../broker/types.js";
import { createStrategy } from "../strategy/engine.js";
import { applyPnl, checkRisk, createRiskState } from "../risk/guardian.js";
import { log } from "../ops/logger.js";
import { Ledger } from "../accounting/ledger.js";
import { formatSummary, maxConsecutiveLosses } from "../analytics/summary.js";
import { withRetry } from "../ops/retry.js";

export async function runLoops(settings: Settings, broker: Broker, loops: number): Promise<Ledger> {
  const strategy = createStrategy(settings, broker);
  const risk = createRiskState(broker.equityUsd());
  const ledger = new Ledger();
  const n = loops <= 0 ? Number.POSITIVE_INFINITY : loops;
  for (let i = 0; i < n; i++) {
    if (risk.halted) {
      log("warn", "halted", { reason: risk.reason, loop: i });
      break;
    }
    const gate = checkRisk(settings, risk, settings.risk.maxPositionUsd);
    if (!gate.ok) {
      log("warn", "risk_block", { reason: gate.reason, loop: i });
      if (risk.halted) break;
      continue;
    }
    const res = await withRetry(() => strategy.step(), { retries: 1, label: "strategy.step" });
    applyPnl(risk, res.pnlUsd);
    ledger.push({
      ts: Date.now(),
      action: res.action,
      reason: res.reason,
      pnlUsd: res.pnlUsd,
      equity: risk.equity,
      tag: res.reason,
    });
    log("info", "loop", {
      loop: i + 1,
      action: res.action,
      reason: res.reason,
      pnlUsd: Number(res.pnlUsd.toFixed(4)),
      equity: Number(risk.equity.toFixed(2)),
      broker: broker.name,
    });
    if (settings.loopIntervalMs > 0 && i + 1 < n) {
      await new Promise((r) => setTimeout(r, Math.min(settings.loopIntervalMs, 50)));
    }
  }
  const pnls = ledger.entries.map((e) => e.pnlUsd);
  log("info", "done", {
    equity: Number(risk.equity.toFixed(2)),
    dailyPnl: Number(risk.dailyPnl.toFixed(2)),
    halted: risk.halted,
    summary: formatSummary(ledger),
    maxConsecutiveLosses: maxConsecutiveLosses(pnls),
  });
  return ledger;
}
