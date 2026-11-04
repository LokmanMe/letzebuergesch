import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { BOX_INTERVALS, isDue, review } from "./leitner";
import type { Box, CardProgress } from "./types";

const T = "2026-03-10";
const at = (box: Box, due = T): CardProgress => ({ box, due, firstSeen: "2026-01-01", lastReviewed: "2026-03-01", reviews: 3, lapses: 0 });

describe("review — carte neuve", () => {
  it("entre en boîte 1 sur Raté ou Difficile, à revoir le lendemain", () => {
    for (const rating of ["again", "hard"] as const) {
      const p = review(undefined, rating, T);
      expect(p.box).toBe(1);
      expect(p.due).toBe("2026-03-11");
      expect(p.firstSeen).toBe(T);
      expect(p.reviews).toBe(1);
      expect(p.lapses).toBe(0);
    }
  });

  it("passe en boîte 2 sur Facile (entre en 1 puis monte), échéance 3 jours", () => {
    const p = review(undefined, "easy", T);
    expect(p.box).toBe(2);
    expect(p.due).toBe("2026-03-13");
  });
});

describe("review — transitions de boîte", () => {
  it.each([1, 2, 3, 4, 5] as Box[])("Raté depuis la boîte %i → boîte 1, J+1, un échec de plus", (box) => {
    const p = review(at(box), "again", T);
    expect(p.box).toBe(1);
    expect(p.due).toBe("2026-03-11");
    expect(p.lapses).toBe(1);
  });

  it.each([1, 2, 3, 4, 5] as Box[])("Difficile en boîte %i → même boîte, intervalle de la boîte", (box) => {
    const p = review(at(box), "hard", T);
    expect(p.box).toBe(box);
    expect(p.due).toBe(addDays(T, BOX_INTERVALS[box]));
  });

  it.each([
    [1, 2, "2026-03-13"],
    [2, 3, "2026-03-17"],
    [3, 4, "2026-03-24"],
    [4, 5, "2026-04-09"],
    [5, 5, "2026-04-09"],
  ] as [Box, Box, string][])("Facile en boîte %i → boîte %i, échéance %s", (from, to, due) => {
    const p = review(at(from), "easy", T);
    expect(p.box).toBe(to);
    expect(p.due).toBe(due);
  });

  it("conserve firstSeen et incrémente reviews", () => {
    const p = review(at(3), "easy", T);
    expect(p.firstSeen).toBe("2026-01-01");
    expect(p.lastReviewed).toBe(T);
    expect(p.reviews).toBe(4);
  });

  it("ne modifie pas l'objet d'origine (fonction pure)", () => {
    const original = at(2);
    const copy = { ...original };
    review(original, "easy", T);
    expect(original).toEqual(copy);
  });
});

describe("échéances", () => {
  it("gère les fins de mois et d'année", () => {
    expect(review(at(5), "hard", "2026-12-15").due).toBe("2027-01-14");
    expect(review(at(4), "hard", "2028-02-20").due).toBe("2028-03-05"); // année bissextile
    expect(review(at(1), "hard", "2026-02-28").due).toBe("2026-03-01");
  });

  it("isDue : due aujourd'hui ou en retard", () => {
    expect(isDue(at(1, "2026-03-10"), T)).toBe(true);
    expect(isDue(at(1, "2026-03-01"), T)).toBe(true);
    expect(isDue(at(1, "2026-03-11"), T)).toBe(false);
  });
});
