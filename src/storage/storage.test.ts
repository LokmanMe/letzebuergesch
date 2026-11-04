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
    const s = { ...applyRating(defaultState(), "x", "hard", "2026-03-10"), settings: { newPerDay: 12 } };
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
  it("un état sans schemaVersion (v0) est migré en v1 avec des valeurs par défaut", () => {
    const s = migrate({ progress: {} });
    expect(s.schemaVersion).toBe(1);
    expect(s.settings.newPerDay).toBe(8);
    expect(s.customCards).toEqual([]);
  });

  it("complète firstSeen manquant à partir de lastReviewed", () => {
    const s = migrate({
      schemaVersion: 1,
      progress: { a: { box: 2, due: "2026-03-12", lastReviewed: "2026-03-09", reviews: 2, lapses: 0 } },
    });
    expect(s.progress.a.firstSeen).toBe("2026-03-09");
  });
});
