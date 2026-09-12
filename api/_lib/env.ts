import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

let loadedLocal = false;

/** Fill missing process.env keys from .env.local so `vercel dev` can save reviews. */
function loadDotEnvLocal() {
  if (loadedLocal) return;
  loadedLocal = true;
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]?.trim()) process.env[key] = value;
  }
}

export function env(name: string) {
  loadDotEnvLocal();
  const raw = process.env[name]?.trim() ?? "";
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}
