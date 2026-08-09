import type { Settings } from "../config/schema.js";
import type { Broker, Fill, OrderRequest } from "./types.js";

export function createPaperBroker(settings: Settings, seedPrice = 65000): Broker {
  let equity = settings.paper.initialEquityUsd;
  let price = seedPrice;
  const positions = new Map<string, number>();

  function bump(): void {
    const shock = (Math.random() - 0.5) * 2 * settings.paper.volatility;
    price = Math.max(1, price * (1 + shock));
  }

  return {
    name: "paper",
    async getMid(symbol: string) {
      bump();
      return price;
    },
    async place(order: OrderRequest): Promise<Fill> {
      bump();
      const slip = settings.paper.slippageBps / 10_000;
      const px = order.side === "buy" ? price * (1 + slip) : price * (1 - slip);
      const amount = order.amountUsd / px;
      const fee = order.amountUsd * (settings.paper.feeBps / 10_000);
      const prev = positions.get(order.symbol) ?? 0;
      const signed = order.side === "buy" ? amount : -amount;
      positions.set(order.symbol, prev + signed);
      // mark-to-market rough: fee drag only; pnl applied by strategy via mark
      equity -= fee;
      return {
        symbol: order.symbol,
        side: order.side,
        price: px,
        amount,
        feeUsd: fee,
        ts: Date.now(),
        tag: order.tag,
      };
    },
    equityUsd: () => equity,
    positionQty: (symbol) => positions.get(symbol) ?? 0,
  };
}
