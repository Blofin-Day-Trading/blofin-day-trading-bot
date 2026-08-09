export function liquidationDistancePct(leverage: number, mmr = 0.005): number {
  // rough inverse: higher leverage → closer liq
  return Math.max(0.1, (1 / Math.max(1, leverage)) * 100 - mmr * 100);
}
