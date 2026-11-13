import { isValidLocalDate } from "../domain/dates";
import {
  CURRENT_SCHEMA_VERSION,
  type AppState,
  type Box,
  type Card,
  type CardProgress,
  type DayLog,
  type PhraseOfDayEntry,
} from "../domain/types";
import { defaultState } from "./defaultState";

export class InvalidStateError extends Error {}

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);
const isNonNegInt = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

/**
 * Migrations successives : MIGRATIONS[n] transforme un état de version n en version n+1.
 * Pour ajouter un champ en V2 : passer CURRENT_SCHEMA_VERSION à 2 et ajouter MIGRATIONS[1].
 */
const MIGRATIONS: Record<number, (s: Raw) => Raw> = {
  // Version 0 : état sans schemaVersion (aucune donnée réelle, sécurité).
  0: (s) => ({ ...s, schemaVersion: 1 }),
  // Version 2 : objectif du jour (réglage) et compteur d'entraînement dans le journal.
  1: (s) => ({
    ...s,
    schemaVersion: 2,
    settings: { ...(isObject(s.settings) ? s.settings : {}), dailyGoal: 15 },
    log: isObject(s.log)
      ? Object.fromEntries(Object.entries(s.log).map(([d, l]) => [d, isObject(l) ? { ...l, practiced: 0 } : l]))
      : s.log,
  }),
  // Version 3 : sens des cartes (réglage) et badges débloqués.
  2: (s) => ({
    ...s,
    schemaVersion: 3,
    settings: { ...(isObject(s.settings) ? s.settings : {}), direction: "mixed" },
    achievements: {},
  }),
  // Version 4 : leçons de grammaire lues.
  3: (s) => ({ ...s, schemaVersion: 4, lessonsRead: {} }),
};

function sanitizeProgress(v: unknown): Record<string, CardProgress> {
  if (!isObject(v)) throw new InvalidStateError("progress invalide");
  const out: Record<string, CardProgress> = {};
  for (const [id, p] of Object.entries(v)) {
    if (
      !isObject(p) ||
      ![1, 2, 3, 4, 5].includes(p.box as number) ||
      !isValidLocalDate(p.due) ||
      !isValidLocalDate(p.lastReviewed) ||
      !isNonNegInt(p.reviews) ||
      !isNonNegInt(p.lapses)
    ) {
      throw new InvalidStateError(`progression invalide pour la carte ${id}`);
    }
    out[id] = {
      box: p.box as Box,
      due: p.due,
      firstSeen: isValidLocalDate(p.firstSeen) ? p.firstSeen : p.lastReviewed,
      lastReviewed: p.lastReviewed,
      reviews: p.reviews,
      lapses: p.lapses,
    };
  }
  return out;
}

function sanitizeLog(v: unknown): Record<string, DayLog> {
  if (!isObject(v)) throw new InvalidStateError("journal invalide");
  const out: Record<string, DayLog> = {};
  for (const [date, d] of Object.entries(v)) {
    if (
      !isValidLocalDate(date) ||
      !isObject(d) ||
      !isNonNegInt(d.reviewed) ||
      !isNonNegInt(d.newIntroduced) ||
      !isNonNegInt(d.practiced)
    ) {
      throw new InvalidStateError(`journal invalide pour le ${date}`);
    }
    out[date] = { reviewed: d.reviewed, newIntroduced: d.newIntroduced, practiced: d.practiced };
  }
  return out;
}

function sanitizePhraseOfDay(v: unknown): Record<string, PhraseOfDayEntry> {
  if (!isObject(v)) throw new InvalidStateError("phrases du jour invalides");
  const out: Record<string, PhraseOfDayEntry> = {};
  for (const [date, e] of Object.entries(v)) {
    if (!isValidLocalDate(date) || !isObject(e) || typeof e.cardId !== "string" || typeof e.done !== "boolean") {
      throw new InvalidStateError(`phrase du jour invalide pour le ${date}`);
    }
    out[date] = { cardId: e.cardId, done: e.done };
  }
  return out;
}

function sanitizeCustomCards(v: unknown): Card[] {
  if (!Array.isArray(v)) throw new InvalidStateError("cartes personnelles invalides");
  return v.filter(
    (c): c is Card =>
      isObject(c) &&
      typeof c.id === "string" &&
      typeof c.moduleId === "string" &&
      c.type === "phrase" &&
      typeof c.fr === "string" &&
      typeof c.lb === "string" &&
      typeof c.phonetic === "string" &&
      typeof c.verified === "boolean",
  );
}

function sanitizeAchievements(v: unknown): Record<string, string> {
  if (!isObject(v)) throw new InvalidStateError("badges invalides");
  return Object.fromEntries(Object.entries(v).filter(([, d]) => isValidLocalDate(d))) as Record<string, string>;
}

/** Convertit des données brutes (localStorage ou fichier importé) en état courant valide. Lève InvalidStateError sinon. */
export function migrate(raw: unknown): AppState {
  if (!isObject(raw)) throw new InvalidStateError("le fichier ne contient pas un objet JSON");
  let s: Raw = raw;
  let version = typeof s.schemaVersion === "number" ? s.schemaVersion : 0;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new InvalidStateError("ces données viennent d'une version plus récente de l'appli");
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new InvalidStateError(`aucune migration depuis la version ${version}`);
    s = step(s);
    version++;
  }

  const defaults = defaultState();
  const settings = isObject(s.settings) ? s.settings : {};
  const newPerDay = isNonNegInt(settings.newPerDay) ? Math.min(settings.newPerDay, 50) : defaults.settings.newPerDay;
  const dailyGoal =
    isNonNegInt(settings.dailyGoal) && settings.dailyGoal > 0 ? Math.min(settings.dailyGoal, 200) : defaults.settings.dailyGoal;

  // "progressive" (ancien mode par défaut, remplacé) devient le mode mixé.
  const direction = settings.direction === "fr-lb" || settings.direction === "lb-fr" ? settings.direction : defaults.settings.direction;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    settings: { newPerDay, dailyGoal, direction },
    progress: sanitizeProgress(s.progress ?? {}),
    log: sanitizeLog(s.log ?? {}),
    phraseOfDay: sanitizePhraseOfDay(s.phraseOfDay ?? {}),
    customCards: sanitizeCustomCards(s.customCards ?? []),
    achievements: sanitizeAchievements(s.achievements ?? {}),
    lessonsRead: sanitizeAchievements(s.lessonsRead ?? {}),
  };
}
