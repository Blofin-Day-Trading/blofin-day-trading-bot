import test from "node:test";
import assert from "node:assert/strict";
import { loadSettings } from "../src/config/load.js";
import { createPaperBroker } from "../src/broker/paper.js";
import { createStrategy } from "../src/strategy/engine.js";
import { checkRisk, createRiskState, applyPnl } from "../src/risk/guardian.js";

test("blofin-day-trading-bot settings load", () => {
  const s = loadSettings(process.cwd());
  assert.equal(s.venue, "blofin");
  assert.ok(s.risk.maxDailyLossUsd > 0);
});

test("blofin-day-trading-bot paper strategy steps", async () => {
  const s = loadSettings(process.cwd());
  const broker = createPaperBroker(s, 65000);
  const strat = createStrategy(s, broker);
  let actions = 0;
  for (let i = 0; i < 8; i++) {
    const r = await strat.step();
    assert.ok(r.action);
    actions += 1;
  }
  assert.equal(actions, 8);
});

test("blofin-day-trading-bot risk guardian trips daily loss", () => {
  const s = loadSettings(process.cwd());
  const st = createRiskState(10_000);
  applyPnl(st, -(s.risk.maxDailyLossUsd + 1));
  const g = checkRisk(s, st, 100);
  assert.equal(g.ok, false);
  assert.equal(st.halted, true);
});
