import { describe, expect, it } from "vitest";
import { defaultState } from "../storage/defaultState";
import type { AppState, Box, Card, CardProgress } from "../domain/types";
import { ACHIEVEMENTS, newAchievements, recordAchievements } from "./rules";

const T = "2026-03-10";
const card = (n: number, moduleId = "m"): Card => ({ id: `${moduleId}-${n}`, moduleId, type: "phrase", fr: "", lb: "", phonetic: "", verified: false });
const p = (box: Box): CardProgress => ({ box, due: T, firstSeen: T, lastReviewed: T, reviews: 1, lapses: 0 });
const ids = (s: AppState, cards: Card[]) => newAchievements({ state: s, cards, today: T }).map((a) => a.id);

describe("badges", () => {
  it("ids uniques, icône, titre et description pour chacun", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.icon && a.title && a.description).toBeTruthy();
  });

  it("aucun badge pour un état vide", () => {
    expect(ids(defaultState(), [card(1)])).toEqual([]);
  });

  it("première découverte, objectif du jour et thème maîtrisé", () => {
    const cards = [card(1, "a"), card(2, "a"), card(3, "b"), card(4, "b")];
    const s: AppState = {
      ...defaultState(),
      progress: { "a-1": p(4), "a-2": p(5), "b-3": p(1) },
      log: { [T]: { reviewed: 10, newIntroduced: 3, practiced: 5 } },
    };
    expect(ids(s, cards)).toEqual(["first-step", "goal-1", "theme"]);
  });

  it("un badge enregistré n'est plus proposé, et reste acquis même si la condition ne tient plus", () => {
    const s = { ...defaultState(), progress: { "m-1": p(1) } };
    const recorded = recordAchievements(s, ["first-step"], T);
    expect(recorded.achievements).toEqual({ "first-step": T });
    expect(ids(recorded, [card(1), card(2)])).toEqual([]);
    expect(recordAchievements(recorded, ["first-step"], "2026-04-01")).toBe(recorded);
  });

  it("phrases du jour placées", () => {
    const phraseOfDay = Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [`2026-03-0${i + 1}`, { cardId: "m-1", done: true }]),
    );
    expect(ids({ ...defaultState(), phraseOfDay }, [card(1)])).toEqual(["phrase-1", "phrase-5"]);
  });
});
