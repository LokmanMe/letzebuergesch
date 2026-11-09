import { describe, expect, it } from "vitest";
import { cardDirection } from "./direction";
import type { Box, CardProgress } from "./types";

const p = (box: Box): CardProgress => ({ box, due: "2026-03-10", firstSeen: "2026-03-01", lastReviewed: "2026-03-01", reviews: 1, lapses: 0 });

describe("sens des cartes", () => {
  it("progressif : à l'envers tant que la phrase est récente (1 ou 2 points), puis à l'endroit", () => {
    expect(cardDirection("progressive", undefined)).toBe("lb-fr");
    expect(cardDirection("progressive", p(1))).toBe("lb-fr");
    expect(cardDirection("progressive", p(2))).toBe("lb-fr");
    expect(cardDirection("progressive", p(3))).toBe("fr-lb");
    expect(cardDirection("progressive", p(5))).toBe("fr-lb");
  });

  it("sens imposé par le réglage", () => {
    expect(cardDirection("fr-lb", p(1))).toBe("fr-lb");
    expect(cardDirection("lb-fr", p(5))).toBe("lb-fr");
  });
});
