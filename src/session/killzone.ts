export function inSession(hourUtc: number, start: number, end: number): boolean {
  if (start <= end) return hourUtc >= start && hourUtc < end;
  return hourUtc >= start || hourUtc < end;
}
