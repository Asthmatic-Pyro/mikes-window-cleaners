import process from "node:process";

export function env(name: string) {
  const raw = process.env[name]?.trim() ?? "";
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).trim();
  }
  return raw;
}
