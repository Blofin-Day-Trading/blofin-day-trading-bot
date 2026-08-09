import fs from "node:fs";
import path from "node:path";
import { SettingsSchema, type Settings } from "./schema.js";

export function loadEnvFile(root = process.cwd()): void {
  const p = path.join(root, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

export function loadSettings(root = process.cwd()): Settings {
  const raw = JSON.parse(fs.readFileSync(path.join(root, "settings.json"), "utf8"));
  return SettingsSchema.parse(raw);
}

export function getCredentials(prefix: string): { apiKey: string; secret: string; password?: string } {
  const apiKey =
    process.env[`${prefix}_API_KEY`] ??
    process.env.API_KEY ??
    "";
  const secret =
    process.env[`${prefix}_API_SECRET`] ??
    process.env.API_SECRET ??
    "";
  const password =
    process.env[`${prefix}_PASSWORD`] ??
    process.env[`${prefix}_PASSPHRASE`] ??
    process.env.API_PASSWORD ??
    undefined;
  return { apiKey, secret, password: password || undefined };
}
