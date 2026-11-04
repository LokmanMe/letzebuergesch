import { describe, expect, it } from "vitest";
import { defaultState } from "../storage/defaultState";
import { pickPhraseOfDay, phraseHistory, setPhraseOfDayDone } from "./phraseOfDay";
import { a1Progress, activity, fragileCards, solidCards, streak } from "./stats";
import type { AppState, Box, Card } from "./types";

const T = "2026-03-10";
const cards: Card[] = ["a", "b", "c", "d"].map((x, i) => ({
  id: x,
  moduleId: i < 2 ? "m1" : "m2",
  type: "phrase",
  fr: x,
  lb: x,
  phonetic: "",
  verified: false,
}));
const withLog = (days: string[]): AppState => ({
  ...defaultState(),
  log: Object.fromEntries(days.map((d) => [d, { reviewed: 3, newIntroduced: 0 }])),
});
const withBoxes = (boxes: Record<string, Box>): AppState => ({
  ...defaultState(),
  progress: Object.fromEntries(
    Object.entries(boxes).map(([id, box]) => [id, { box, due: T, firstSeen: T, lastReviewed: T, reviews: 1, lapses: 0 }]),
  ),
});

describe("série", () => {
  it("compte les jours consécutifs jusqu'à aujourd'hui", () => {
    expect(streak(withLog(["2026-03-08", "2026-03-09", "2026-03-10"]), T)).toBe(3);
  });
  it("aujourd'hui pas encore fait : la série d'hier est conservée", () => {
    expect(streak(withLog(["2026-03-08", "2026-03-09"]), T)).toBe(2);
  });
  it("un jour manqué casse la série", () => {
    expect(streak(withLog(["2026-03-07", "2026-03-08"]), T)).toBe(0);
    expect(streak(withLog(["2026-03-06", "2026-03-08", "2026-03-09", "2026-03-10"]), T)).toBe(3);
  });
  it("traverse un changement de mois", () => {
    expect(streak(withLog(["2026-02-28", "2026-03-01"]), "2026-03-01")).toBe(2);
  });
});

describe("progression", () => {
  const s = withBoxes({ a: 1, b: 2, c: 4, d: 5 });
  it("solides = boîtes 4-5, fragiles = boîtes 1-2", () => {
    expect(solidCards(cards, s).map((c) => c.id)).toEqual(["c", "d"]);
    expect(fragileCards(cards, s).map((c) => c.id)).toEqual(["a", "b"]);
  });
  it("progression A1 = part des cartes solides", () => {
    expect(a1Progress(cards, s)).toBe(0.5);
    expect(a1Progress([], s)).toBe(0);
  });
  it("activité sur 30 jours, du plus ancien au plus récent", () => {
    const a = activity(withLog(["2026-03-10", "2026-02-09"]), T);
    expect(a).toHaveLength(30);
    expect(a[0]).toEqual({ date: "2026-02-09", reviewed: 3 });
    expect(a[29]).toEqual({ date: T, reviewed: 3 });
    expect(a[15].reviewed).toBe(0);
  });
});

describe("phrase du jour", () => {
  it("sans carte vue : choisit dans le premier module, de façon déterministe", () => {
    const s = defaultState();
    const c = pickPhraseOfDay(cards, s, T);
    expect(["a", "b"]).toContain(c?.id);
    expect(pickPhraseOfDay(cards, s, T)?.id).toBe(c?.id);
  });
  it("choisit parmi les cartes vues et évite celles déjà faites", () => {
    let s = withBoxes({ c: 1, d: 1 });
    s = setPhraseOfDayDone(s, "2026-03-09", "c", true);
    expect(pickPhraseOfDay(cards, s, T)?.id).toBe("d");
  });
  it("garde la phrase déjà attribuée aujourd'hui et l'historique", () => {
    let s = setPhraseOfDayDone(defaultState(), T, "b", false);
    expect(pickPhraseOfDay(cards, s, T)?.id).toBe("b");
    s = setPhraseOfDayDone(s, T, "b", true);
    s = setPhraseOfDayDone(s, "2026-03-08", "a", true);
    expect(phraseHistory(s)).toEqual([
      { date: T, cardId: "b" },
      { date: "2026-03-08", cardId: "a" },
    ]);
  });
});
