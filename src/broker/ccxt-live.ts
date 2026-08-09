import ccxt, { type Exchange } from "ccxt";
import type { Settings } from "../config/schema.js";
import { getCredentials } from "../config/load.js";
import type { Broker, Fill, OrderRequest } from "./types.js";

export function assertLiveAllowed(settings: Settings, confirmLive: boolean, prefix: string): void {
  if (!confirmLive && settings.live.confirmRequired) {
    throw new Error("Live mode refused: pass --confirm-live");
  }
  const creds = getCredentials(prefix);
  if (!creds.apiKey || !creds.secret) {
    throw new Error(`Live mode refused: missing ${prefix}_API_KEY / ${prefix}_API_SECRET`);
  }
}

export function createCcxtBroker(settings: Settings, prefix: string, exchangeId: string): Broker {
  const creds = getCredentials(prefix);
  const ExchangeClass = (ccxt as unknown as Record<string, new (opts: object) => Exchange>)[exchangeId];
  if (!ExchangeClass) {
    throw new Error(`CCXT exchange not found: ${exchangeId}. Install/update ccxt or use paper mode.`);
  }
  const ex = new ExchangeClass({
    apiKey: creds.apiKey,
    secret: creds.secret,
    password: creds.password,
    enableRateLimit: true,
    options: { defaultType: settings.marketType === "swap" ? "swap" : "spot" },
  });
  if (settings.live.sandbox && typeof (ex as Exchange & { setSandboxMode?: (v: boolean) => void }).setSandboxMode === "function") {
    (ex as Exchange & { setSandboxMode: (v: boolean) => void }).setSandboxMode(true);
  }

  let cashEquity = settings.paper.initialEquityUsd;
  const positions = new Map<string, number>();

  return {
    name: `ccxt:${exchangeId}`,
    async getMid(symbol: string) {
      const t = await ex.fetchTicker(symbol);
      const mid = Number(t.last ?? t.close ?? t.bid ?? 0);
      if (!Number.isFinite(mid) || mid <= 0) throw new Error("bad ticker");
      return mid;
    },
    async place(order: OrderRequest): Promise<Fill> {
      const mid = await this.getMid(order.symbol);
      const amount = order.amountUsd / mid;
      // Fail-closed: we create the order only when credentials validated.
      // Many sandboxes reject; wrap errors clearly.
      try {
        const o = await ex.createOrder(order.symbol, "market", order.side, amount);
        const px = Number(o.average ?? o.price ?? mid);
        const filled = Number(o.filled ?? amount);
        const fee = order.amountUsd * 0.0008;
        const prev = positions.get(order.symbol) ?? 0;
        positions.set(order.symbol, prev + (order.side === "buy" ? filled : -filled));
        cashEquity -= fee;
        return {
          symbol: order.symbol,
          side: order.side,
          price: px,
          amount: filled,
          feeUsd: fee,
          ts: Date.now(),
          tag: order.tag,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`Live order failed (fail-closed): ${msg}`);
      }
    },
    equityUsd: () => cashEquity,
    positionQty: (s) => positions.get(s) ?? 0,
  };
}
