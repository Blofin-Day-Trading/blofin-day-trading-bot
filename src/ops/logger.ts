export type LogLevel = "debug" | "info" | "warn" | "error";

export function log(level: LogLevel, msg: string, data?: Record<string, unknown>): void {
  const line = { ts: new Date().toISOString(), level, msg, ...data };
  const s = JSON.stringify(line);
  if (level === "error") console.error(s);
  else console.log(s);
}
