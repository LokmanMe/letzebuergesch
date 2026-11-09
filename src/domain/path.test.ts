import { describe, expect, it } from "vitest";
import { MODULES } from "../content";
import { defaultState } from "../storage/defaultState";
import { buildStages, currentStageIndex, stageProgress } from "./path";
import type { AppState, Box, Card, Module } from "./types";

const T = "2026-03-10";
const card = (m: string, n: number): Card => ({
  id: `${m}-${String(n).padStart(3, "0")}`,
  moduleId: m,
  type: "phrase",
  fr: "",
  lb: "",
  phonetic: "",
  verified: false,
});
const mod = (id: string, n: number): Module => ({
  id,
  title: id,
  description: "",
  cards: Array.from({ length: n }, (_, i) => card(id, i + 1)),
});
const withBoxes = (boxes: Record<string, Box>): AppState => ({
  ...defaultState(),
  progress: Object.fromEntries(
    Object.entries(boxes).map(([id, box]) => [id, { box, due: T, firstSeen: T, lastReviewed: T, reviews: 1, lapses: 0 }]),
  ),
});

describe("parcours", () => {
  it("découpe chaque module en étapes équilibrées d'au plus 8 cartes, dans l'ordre", () => {
    const stages = buildStages([mod("a", 17), mod("b", 5), mod("c", 16)]);
    expect(stages.map((s) => [s.id, s.cardIds.length, `${s.part}/${s.parts}`])).toEqual([
      ["a-1", 6, "1/3"],
      ["a-2", 6, "2/3"],
      ["a-3", 5, "3/3"],
      ["b-1", 5, "1/1"],
      ["c-1", 8, "1/2"],
      ["c-2", 8, "2/2"],
    ]);
    expect(stages.map((s) => s.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("toutes les cartes du contenu sont dans exactement une étape", () => {
    const stages = buildStages(MODULES);
    const ids = stages.flatMap((s) => s.cardIds);
    expect(ids).toEqual(MODULES.flatMap((m) => m.cards.map((c) => c.id)));
  });

  it("les cartes perso forment une dernière étape", () => {
    const stages = buildStages([mod("a", 3)], [card("perso", 1)]);
    expect(stages.at(-1)).toMatchObject({ moduleId: "perso", title: "Mes cartes", cardIds: ["perso-001"] });
  });

  it("statuts : terminée, en cours, verrouillée ; étoiles selon les boîtes", () => {
    const stages = buildStages([mod("a", 2), mod("b", 2), mod("c", 2)]);
    const state = withBoxes({ "a-001": 4, "a-002": 5, "b-001": 1 });
    expect(currentStageIndex(stages, state)).toBe(1);
    expect(stageProgress(stages, state)).toEqual([
      { total: 2, seen: 2, solid: 2, stars: 3, status: "done" },
      { total: 2, seen: 1, solid: 0, stars: 0, status: "current" },
      { total: 2, seen: 0, solid: 0, stars: 0, status: "locked" },
    ]);
  });

  it("étoiles : 1 = toutes vues, 2 = toutes en boîte 3+, 3 = toutes solides", () => {
    const stages = buildStages([mod("a", 2)]);
    const stars = (b1: Box, b2: Box) => stageProgress(stages, withBoxes({ "a-001": b1, "a-002": b2 }))[0].stars;
    expect(stars(1, 5)).toBe(1);
    expect(stars(3, 4)).toBe(2);
    expect(stars(4, 4)).toBe(3);
  });

  it("parcours terminé : l'étape en cours est au-delà de la dernière", () => {
    const stages = buildStages([mod("a", 1)]);
    expect(currentStageIndex(stages, withBoxes({ "a-001": 1 }))).toBe(1);
  });
});
