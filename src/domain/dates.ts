import type { LocalDate } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

/** Date locale (fuseau de l'appareil) au format YYYY-MM-DD. N'utilise jamais toISOString() (UTC). */
export function toLocalDate(d: Date): LocalDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function today(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

/** Interprète une date locale à midi pour éviter les effets de changement d'heure. */
export function parseLocalDate(s: LocalDate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}

export function addDays(s: LocalDate, days: number): LocalDate {
  const d = parseLocalDate(s);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** Nombre de jours de a vers b (b - a). */
export function diffDays(a: LocalDate, b: LocalDate): number {
  const ms = parseLocalDate(b).getTime() - parseLocalDate(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function isValidLocalDate(s: unknown): s is LocalDate {
  if (typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toLocalDate(parseLocalDate(s)) === s;
}
