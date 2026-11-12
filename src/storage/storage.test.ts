import { describe, expect, it } from "vitest";
import { applyRating } from "../domain/session";
import { defaultState } from "./defaultState";
import { createLocalStorageStorage, STORAGE_KEY } from "./localStorageStorage";
import { InvalidStateError, migrate } from "./migrations";

function memoryBackend() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

describe("localStorageStorage", () => {
  it("renvoie l'état par défaut si rien n'est enregistré", () => {
    expect(createLocalStorageStorage(memoryBackend()).load()).toEqual(defaultState());
  });

  it("aller-retour save → load", () => {
    const backend = memoryBackend();
    const storage = createLocalStorageStorage(backend);
    const s = applyRating(defaultState(), "greetings-001", "easy", "2026-03-10");
    storage.save(s);
    expect(storage.load()).toEqual(s);
  });

  it("aller-retour export → import", () => {
    const storage = createLocalStorageStorage(memoryBackend());
    const s = { ...applyRating(defaultState(), "x", "hard", "2026-03-10"), settings: { newPerDay: 12, dailyGoal: 15, direction: "mixed" as const } };
    expect(storage.import(storage.export(s))).toEqual(s);
  });

  it("import invalide : erreur explicite", () => {
    const storage = createLocalStorageStorage(memoryBackend());
    expect(() => storage.import("pas du json")).toThrow(InvalidStateError);
    expect(() => storage.import("[1,2]")).toThrow(InvalidStateError);
    expect(() => storage.import(JSON.stringify({ schemaVersion: 1, progress: { a: { box: 9 } } }))).toThrow(InvalidStateError);
    expect(() => storage.import(JSON.stringify({ schemaVersion: 99 }))).toThrow(/plus récente/);
  });

  it("données corrompues au chargement : copie de secours et état par défaut", () => {
    const backend = memoryBackend();
    backend.setItem(STORAGE_KEY, "{oups");
    const original = console.error;
    console.error = () => {};
    expect(createLocalStorageStorage(backend).load()).toEqual(defaultState());
    console.error = original;
    expect([...backend.data.keys()].some((k) => k.includes("backup"))).toBe(true);
  });
});

describe("migrations", () => {
  it("un état sans schemaVersion (v0) est migré vers la version courante avec des valeurs par défaut", () => {
    const s = migrate({ progress: {} });
    expect(s.schemaVersion).toBe(3);
    expect(s.settings.dailyGoal).toBe(15);
    expect(s.settings.newPerDay).toBe(8);
    expect(s.customCards).toEqual([]);
  });

  it("v1 → v2 : objectif du jour par défaut et compteur d'entraînement à 0, progression conservée", () => {
    const v1 = {
      schemaVersion: 1,
      settings: { newPerDay: 10 },
      progress: { a: { box: 3, due: "2026-03-12", firstSeen: "2026-03-01", lastReviewed: "2026-03-05", reviews: 4, lapses: 1 } },
      log: { "2026-03-05": { reviewed: 12, newIntroduced: 8 } },
      phraseOfDay: { "2026-03-05": { cardId: "a", done: true } },
      customCards: [],
    };
    const s = migrate(v1);
    expect(s.schemaVersion).toBe(3);
    expect(s.settings).toEqual({ newPerDay: 10, dailyGoal: 15, direction: "mixed" as const });
    expect(s.log["2026-03-05"]).toEqual({ reviewed: 12, newIntroduced: 8, practiced: 0 });
    expect(s.progress.a.box).toBe(3);
    expect(s.phraseOfDay["2026-03-05"].done).toBe(true);
  });

  it("v2 → v3 : sens mixé par défaut, aucun badge, réglages conservés", () => {
    const s = migrate({ schemaVersion: 2, settings: { newPerDay: 5, dailyGoal: 30 }, progress: {}, log: {}, phraseOfDay: {}, customCards: [] });
    expect(s.schemaVersion).toBe(3);
    expect(s.settings).toEqual({ newPerDay: 5, dailyGoal: 30, direction: "mixed" });
    expect(s.achievements).toEqual({});
  });

  it("v3 : sens et badges importés, valeurs invalides écartées", () => {
    const s = migrate({ schemaVersion: 3, settings: { direction: "lb-fr" }, achievements: { "streak-3": "2026-03-10", bad: "hier" } });
    expect(s.settings.direction).toBe("lb-fr");
    expect(s.achievements).toEqual({ "streak-3": "2026-03-10" });
    expect(migrate({ schemaVersion: 3, settings: { direction: "n importe" } }).settings.direction).toBe("mixed");
    // Ancien mode par défaut, remplacé par le mixé.
    expect(migrate({ schemaVersion: 3, settings: { direction: "progressive" } }).settings.direction).toBe("mixed");
  });

  it("complète firstSeen manquant à partir de lastReviewed", () => {
    const s = migrate({
      schemaVersion: 1,
      progress: { a: { box: 2, due: "2026-03-12", lastReviewed: "2026-03-09", reviews: 2, lapses: 0 } },
    });
    expect(s.progress.a.firstSeen).toBe("2026-03-09");
  });
});
