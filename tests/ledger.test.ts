import test from "node:test";
import assert from "node:assert/strict";
import { Ledger } from "../src/accounting/ledger.js";
import { maxConsecutiveLosses } from "../src/analytics/summary.js";
import { withRetry } from "../src/ops/retry.js";
import { PriceSeries } from "../src/market/series.js";

test("blofin-day-trading-bot ledger summary", () => {
  const l = new Ledger();
  l.push({ ts: 1, action: "buy", reason: "t", pnlUsd: -1, equity: 9999 });
  l.push({ ts: 2, action: "sell", reason: "t", pnlUsd: 2, equity: 10001 });
  const s = l.summary();
  assert.equal(s.trades, 2);
  assert.equal(s.pnl, 1);
});

test("blofin-day-trading-bot consecutive losses", () => {
  assert.equal(maxConsecutiveLosses([-1, -2, 1, -1]), 2);
});

test("blofin-day-trading-bot retry eventually succeeds", async () => {
  let n = 0;
  const v = await withRetry(async () => {
    n += 1;
    if (n < 2) throw new Error("fail");
    return 42;
  }, { retries: 3, delayMs: 1 });
  assert.equal(v, 42);
});

test("blofin-day-trading-bot price series sma", () => {
  const s = new PriceSeries(10);
  for (const v of [1, 2, 3, 4, 5]) s.push(v);
  assert.equal(s.sma(5), 3);
});
