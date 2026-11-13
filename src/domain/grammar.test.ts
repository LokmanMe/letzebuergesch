import { describe, expect, it } from "vitest";
import { LESSONS, MODULES, RAW_GRAMMAR } from "../content";
import { validateLessons } from "../content/schema";
import { defaultState } from "../storage/defaultState";
import { migrate } from "../storage/migrations";
import { lessonStatuses, markLessonRead } from "./grammar";
import { buildStages } from "./path";
import type { AppState, CardProgress } from "./types";

const stages = buildStages(MODULES);
const cards = new Map(MODULES.flatMap((m) => m.cards).map((c) => [c.id, c]));

describe("fiches de grammaire (contenu)", () => {
  it("sont valides", () => {
    expect(validateLessons(RAW_GRAMMAR)).toEqual([]);
    expect(LESSONS.length).toBeGreaterThanOrEqual(8);
  });

  it("sont rattachées à des étapes existantes, dans l'ordre du parcours", () => {
    const order = stages.map((s) => s.id);
    const positions = LESSONS.map((l) => order.indexOf(l.afterStage));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("un exemple lié à une carte reprend exactement son texte (l'audio lod.lu correspond)", () => {
    for (const l of LESSONS)
      for (const e of l.examples)
        if (e.cardId) {
          expect(cards.get(e.cardId), `${l.id} → ${e.cardId}`).toBeDefined();
          expect(e.lb).toBe(cards.get(e.cardId)!.lb);
        }
  });

  it("ne sont pas marquées vérifiées (rédigées par IA)", () => {
    expect(LESSONS.every((l) => l.verified === false)).toBe(true);
  });
});

const T = "2026-03-10";
const seen = (ids: string[]): AppState => {
  const p: CardProgress = { box: 1, due: T, firstSeen: T, lastReviewed: T, reviews: 1, lapses: 0 };
  return { ...defaultState(), progress: Object.fromEntries(ids.map((id) => [id, p])) };
};

describe("statut des leçons", () => {
  const first = LESSONS[0];
  const stage = stages.find((s) => s.id === first.afterStage)!;

  it("à venir tant que l'étape n'est pas terminée, nouvelle ensuite, puis lue", () => {
    expect(lessonStatuses(LESSONS, stages, defaultState()).get(first.id)).toBe("upcoming");
    const done = seen(stage.cardIds);
    expect(lessonStatuses(LESSONS, stages, done).get(first.id)).toBe("new");
    const read = markLessonRead(done, first.id, T);
    expect(read.lessonsRead).toEqual({ [first.id]: T });
    expect(lessonStatuses(LESSONS, stages, read).get(first.id)).toBe("read");
  });

  it("relire une leçon garde la date de première lecture", () => {
    const s = markLessonRead(defaultState(), first.id, T);
    expect(markLessonRead(s, first.id, "2026-03-11")).toBe(s);
  });

  it("migration v3 → v4 : aucune leçon lue, dates invalides écartées", () => {
    expect(migrate({ schemaVersion: 3 }).lessonsRead).toEqual({});
    expect(migrate({ schemaVersion: 4, lessonsRead: { "regle-n": T, x: "hier" } }).lessonsRead).toEqual({ "regle-n": T });
  });
});
