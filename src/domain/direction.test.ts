import { describe, expect, it } from "vitest";
import { cardDirection, REVERSE_EVERY } from "./direction";
import type { CardProgress } from "./types";

const p = (reviews: number): CardProgress => ({ box: 2, due: "2026-03-10", firstSeen: "2026-03-01", lastReviewed: "2026-03-01", reviews, lapses: 0 });

describe("sens des cartes", () => {
  it("mixé : carte neuve et premier rappel toujours en français → luxembourgeois", () => {
    for (const id of ["a", "greetings-001", "office-007", "joker-014"]) {
      expect(cardDirection("mixed", id, undefined)).toBe("fr-lb");
      expect(cardDirection("mixed", id, p(1))).toBe("fr-lb");
    }
  });

  it("mixé : ensuite exactement une révision sur 4 à l'envers, pour chaque carte", () => {
    for (const id of ["a", "greetings-001", "office-007", "joker-014"]) {
      const dirs = Array.from({ length: 8 }, (_, i) => cardDirection("mixed", id, p(i + 2)));
      expect(dirs.filter((d) => d === "lb-fr")).toHaveLength(8 / REVERSE_EVERY);
      // Jamais deux révisions à l'envers d'affilée.
      dirs.forEach((d, i) => d === "lb-fr" && expect(dirs[i + 1]).not.toBe("lb-fr"));
    }
  });

  it("mixé : toutes les cartes ne passent pas à l'envers au même moment", () => {
    const ids = Array.from({ length: 40 }, (_, i) => `m-${i}`);
    const reversed = ids.filter((id) => cardDirection("mixed", id, p(4)) === "lb-fr").length;
    expect(reversed).toBeGreaterThan(0);
    expect(reversed).toBeLessThan(ids.length);
  });

  it("sens imposé par le réglage", () => {
    expect(cardDirection("fr-lb", "a", p(4))).toBe("fr-lb");
    expect(cardDirection("lb-fr", "a", p(1))).toBe("lb-fr");
    expect(cardDirection("lb-fr", "a", undefined)).toBe("lb-fr");
  });
});
