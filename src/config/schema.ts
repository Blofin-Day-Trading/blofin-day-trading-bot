import { z } from "zod";

export const RiskSchema = z.object({
  maxDailyLossUsd: z.number().positive(),
  maxDrawdownPct: z.number().positive(),
  maxNotionalUsd: z.number().positive(),
  maxPositionUsd: z.number().positive(),
  killSwitch: z.boolean().default(false),
});

export const PaperSchema = z.object({
  initialEquityUsd: z.number().positive(),
  feeBps: z.number().nonnegative(),
  slippageBps: z.number().nonnegative(),
  volatility: z.number().positive(),
});

export const LiveSchema = z.object({
  sandbox: z.boolean().default(true),
  confirmRequired: z.boolean().default(true),
});

export const SettingsSchema = z.object({
  mode: z.enum(["paper", "live"]).default("paper"),
  venue: z.string(),
  symbol: z.string(),
  marketType: z.enum(["spot", "swap", "both"]),
  loopIntervalMs: z.number().int().positive(),
  paper: PaperSchema,
  risk: RiskSchema,
  live: LiveSchema,
  strategy: z.record(z.any()),
});

export type Settings = z.infer<typeof SettingsSchema>;
