import type { Settings } from "../config/schema.js";
import type { Broker } from "../broker/types.js";
import { inSession } from "../session/killzone.js";
import { sizeUsd, STOP_UNIT_PCT } from "../sizing/rMultiple.js";
import { donchian } from "../signals/donchian.js";
import { tradesRemaining } from "../session/tradeBudget.js";

export type LoopResult = { action: string; reason: string; pnlUsd: number };

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createStrategy(settings: Settings, broker: Broker) {
  const st = settings.strategy as {
    lookback: number; bufferPct: number; riskPerTradePct: number; takeProfitR: number; stopLossR: number;
    maxTradesPerDay: number; sessionUtcStartHour: number; sessionUtcEndHour: number;
  };
  const closes: number[] = [];
  let trades = 0;
  let dayStamp = utcDate();
  let open: { side: "buy" | "sell"; entry: number; stop: number; tp: number; notional: number } | null = null;

  return {
    async step(): Promise<LoopResult> {
      const now = new Date();
      const today = now.toISOString().slice(0, 10);
      if (today !== dayStamp) {
        dayStamp = today;
        trades = 0;
      }
      const sessionOpen = inSession(now.getUTCHours(), st.sessionUtcStartHour, st.sessionUtcEndHour);
      const mid = await broker.getMid(settings.symbol);
      closes.push(mid);
      if (closes.length > st.lookback) closes.shift();

      if (open) {
        const hitTp = open.side === "buy" ? mid >= open.tp : mid <= open.tp;
        const hitSl = open.side === "buy" ? mid <= open.stop : mid >= open.stop;
        if (hitTp || hitSl) {
          const side = open.side === "buy" ? "sell" : "buy";
          const fill = await broker.place({
            symbol: settings.symbol,
            side,
            amountUsd: open.notional,
            tag: hitTp ? "tp" : "sl",
          });
          const dir = open.side === "buy" ? 1 : -1;
          const pnl = dir * ((mid - open.entry) / open.entry) * open.notional - fill.feeUsd;
          open = null;
          return { action: side, reason: hitTp ? "tp" : "sl", pnlUsd: pnl };
        }
        return { action: "hold", reason: "in_trade", pnlUsd: 0 };
      }

      if (!sessionOpen) return { action: "hold", reason: "session_closed", pnlUsd: 0 };
      if (tradesRemaining(trades, st.maxTradesPerDay) <= 0) {
        return { action: "hold", reason: "max_trades", pnlUsd: 0 };
      }
      const sig = donchian(closes, st.bufferPct);
      if (sig === "flat") return { action: "hold", reason: "no_breakout", pnlUsd: 0 };
      const notional = sizeUsd(broker.equityUsd(), st.riskPerTradePct, STOP_UNIT_PCT, settings.risk.maxPositionUsd);
      const side = sig === "long" ? "buy" : "sell";
      const fill = await broker.place({ symbol: settings.symbol, side, amountUsd: notional, tag: sig });
      const stopDist = mid * (STOP_UNIT_PCT / 100);
      open = {
        side,
        entry: mid,
        stop: side === "buy" ? mid - stopDist * st.stopLossR : mid + stopDist * st.stopLossR,
        tp: side === "buy" ? mid + stopDist * st.takeProfitR : mid - stopDist * st.takeProfitR,
        notional,
      };
      trades += 1;
      return { action: side, reason: `breakout_${sig}`, pnlUsd: -fill.feeUsd };
    },
  };
}
