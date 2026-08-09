export class PriceSeries {
  private readonly values: number[] = [];
  constructor(private readonly max: number) {}

  push(v: number): void {
    this.values.push(v);
    if (this.values.length > this.max) this.values.shift();
  }

  closes(): number[] {
    return [...this.values];
  }

  sma(n: number): number | null {
    if (this.values.length < n) return null;
    const slice = this.values.slice(-n);
    return slice.reduce((s, x) => s + x, 0) / n;
  }

  atrProxy(n: number): number {
    if (this.values.length < 2) return 0;
    const slice = this.values.slice(-Math.min(n + 1, this.values.length));
    let sum = 0;
    for (let i = 1; i < slice.length; i++) sum += Math.abs(slice[i]! - slice[i - 1]!);
    return sum / Math.max(1, slice.length - 1);
  }
}
