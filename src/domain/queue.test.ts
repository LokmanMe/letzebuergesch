import { describe, expect, it } from "vitest";
import { defaultState } from "../storage/defaultState";
import { availableNewCards, buildDailyQueue, buildFlashQueue, dueCards, newCardsRemaining } from "./queue";
import { advanceSession, applyRating, startSession } from "./session";
import type { AppState, Box, Card, CardProgress } from "./types";

const T = "2026-03-10";
const card = (n: number): Card => ({
  id: `m-${String(n).padStart(3, "0")}`,
  moduleId: "m",
  type: "phrase",
  fr: `fr ${n}`,
  lb: `lb ${n}`,
  phonetic: "",
  verified: false,
});
const cards = Array.from({ length: 30 }, (_, i) => card(i + 1));
const p = (box: Box, due: string): CardProgress => ({ box, due, firstSeen: "2026-01-01", lastReviewed: "2026-01-01", reviews: 1, lapses: 0 });

function stateWith(progress: Record<string, CardProgress>, extra: Partial<AppState> = {}): AppState {
  return { ...defaultState(), progress, ...extra };
}

describe("file du jour", () => {
  const state = stateWith({
    "m-001": p(3, "2026-03-10"),
    "m-002": p(1, "2026-03-08"), // en retard
    "m-003": p(2, "2026-03-11"), // pas encore due
    "m-004": p(1, "2026-03-10"),
    "m-005": p(5, "2026-03-08"),
  });

  it("dues triées par échéance (retard d'abord) puis boîte croissante", () => {
    expect(dueCards(cards, state, T).map((c) => c.id)).toEqual(["m-002", "m-005", "m-004", "m-001"]);
  });

  it("révisions d'abord, puis nouvelles cartes jusqu'à la limite (8 par défaut)", () => {
    const q = buildDailyQueue(cards, state, T).map((c) => c.id);
    expect(q.slice(0, 4)).toEqual(["m-002", "m-005", "m-004", "m-001"]);
    expect(q.slice(4)).toEqual(["m-006", "m-007", "m-008", "m-009", "m-010", "m-011", "m-012", "m-013"]);
  });

  it("la limite tient compte des nouvelles cartes déjà vues aujourd'hui", () => {
    const s = stateWith(state.progress, { log: { [T]: { reviewed: 6, newIntroduced: 6 } } });
    expect(newCardsRemaining(s, T)).toBe(2);
    expect(availableNewCards(cards, s, T)).toHaveLength(2);
    const over = stateWith(state.progress, { log: { [T]: { reviewed: 10, newIntroduced: 10 } } });
    expect(newCardsRemaining(over, T)).toBe(0);
  });

  it("la limite se réinitialise le lendemain", () => {
    const s = stateWith({}, { log: { [T]: { reviewed: 8, newIntroduced: 8 } } });
    expect(newCardsRemaining(s, T)).toBe(0);
    expect(newCardsRemaining(s, "2026-03-11")).toBe(8);
  });

  it("révision éclair : 10 dues maximum, aucune nouvelle", () => {
    const many = Object.fromEntries(cards.slice(0, 15).map((c) => [c.id, p(1, "2026-03-09")]));
    const q = buildFlashQueue(cards, stateWith(many), T);
    expect(q).toHaveLength(10);
    expect(q.every((c) => many[c.id])).toBe(true);
    expect(buildFlashQueue(cards, stateWith({}), T)).toHaveLength(0);
  });
});

describe("session", () => {
  it("une carte ratée revient à la fin de la file, une seule fois", () => {
    let q = startSession([card(1), card(2)]);
    q = advanceSession(q, "again");
    expect(q.map((i) => [i.card.id, i.isRetry])).toEqual([["m-002", false], ["m-001", true]]);
    q = advanceSession(q, "easy");
    q = advanceSession(q, "again"); // ratée à nouveau en entraînement : on n'insiste pas
    expect(q).toHaveLength(0);
  });

  it("applyRating met à jour progression et journal ; la 2e présentation ne change rien", () => {
    let s = defaultState();
    s = applyRating(s, "m-001", "again", T);
    expect(s.progress["m-001"]).toMatchObject({ box: 1, due: "2026-03-11" });
    expect(s.log[T]).toEqual({ reviewed: 1, newIntroduced: 1 });

    const afterRetry = applyRating(s, "m-001", "easy", T, true);
    expect(afterRetry).toBe(s);

    s = applyRating(s, "m-002", "easy", T);
    expect(s.log[T]).toEqual({ reviewed: 2, newIntroduced: 2 });
    s = applyRating(s, "m-002", "easy", "2026-03-13");
    expect(s.log["2026-03-13"]).toEqual({ reviewed: 1, newIntroduced: 0 });
    expect(s.progress["m-002"].box).toBe(3);
  });
});
