import { describe, expect, it } from "vitest";
import { lodSearchUrl, mergeCards } from "../domain/content";
import { LOD_AUDIO, MODULES, RAW_MODULES } from "./index";
import { validateModules } from "./schema";

const cards = MODULES.flatMap((m) => m.cards);

describe("contenu officiel", () => {
  it("est valide (champs requis, ids uniques, moduleId cohérent)", () => {
    expect(validateModules(RAW_MODULES)).toEqual([]);
  });

  it("contient 6 modules et 80 à 100 cartes", () => {
    expect(MODULES).toHaveLength(6);
    expect(cards.length).toBeGreaterThanOrEqual(80);
    expect(cards.length).toBeLessThanOrEqual(100);
  });

  it("aucune carte n'est marquée vérifiée (contenu rédigé par IA)", () => {
    expect(cards.every((c) => c.verified === false)).toBe(true);
  });

  it("les ids suivent le format module-NNN", () => {
    for (const c of cards) expect(c.id).toMatch(new RegExp(`^${c.moduleId}-\\d{3}$`));
  });
});

describe("enregistrements lod.lu", () => {
  const entries = Object.entries(LOD_AUDIO);
  const clips = entries.flatMap(([, a]) => [...a.words, ...(a.sentence ? [a.sentence] : [])]);

  it("toutes les URL sont des fichiers hébergés par lod.lu (aucune URL inventée)", () => {
    for (const c of clips) {
      expect(c.aac).toMatch(/^https:\/\/lod\.lu\/uploads\/.+\.m4a$/);
      if (c.ogg) expect(c.ogg).toMatch(/^https:\/\/lod\.lu\/uploads\/.+\.ogg$/);
      expect(c.articleId).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("ne concerne que des cartes existantes", () => {
    const ids = new Set(cards.map((c) => c.id));
    for (const [id] of entries) expect(ids.has(id)).toBe(true);
  });

  it("couvre la grande majorité des cartes", () => {
    expect(entries.length).toBeGreaterThanOrEqual(cards.length * 0.8);
  });
});

describe("validateModules", () => {
  it("détecte les erreurs", () => {
    const errors = validateModules([
      { id: "m", title: "M", description: "d", cards: [
        { id: "m-001", moduleId: "m", type: "phrase", fr: "a", lb: "b", phonetic: "c", verified: false },
        { id: "m-001", moduleId: "x", type: "mcq", fr: "", lb: "b", phonetic: "c" },
      ] },
    ]);
    expect(errors.join("\n")).toMatch(/id en double/);
    expect(errors.join("\n")).toMatch(/moduleId/);
    expect(errors.join("\n")).toMatch(/type inconnu/);
    expect(errors.join("\n")).toMatch(/verified/);
    expect(errors.join("\n")).toMatch(/« fr »/);
  });
});

describe("helpers de contenu", () => {
  it("lien lod.lu = page de recherche uniquement", () => {
    expect(lodSearchUrl({ lb: "Moien!", lodQuery: "Moien" })).toBe("https://lod.lu/sich/lb/Moien");
    expect(lodSearchUrl({ lb: "Gutt Nuecht" })).toBe("https://lod.lu/sich/lb/Gutt%20Nuecht");
  });

  it("fusionne les cartes perso sans écraser le contenu officiel", () => {
    const custom = [
      { ...cards[0], fr: "modifié" },
      { ...cards[0], id: "perso-001", moduleId: "perso" },
    ];
    const merged = mergeCards(MODULES, custom);
    expect(merged).toHaveLength(cards.length + 1);
    expect(merged[0].fr).toBe(cards[0].fr);
    expect(merged.at(-1)?.id).toBe("perso-001");
  });
});
