export function tradesRemaining(used: number, max: number): number {
  return Math.max(0, max - used);
}
