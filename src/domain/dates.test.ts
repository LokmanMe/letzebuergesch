import { describe, expect, it } from "vitest";
import { addDays, diffDays, isValidLocalDate, toLocalDate, today } from "./dates";

describe("dates locales", () => {
  it("passage de minuit : 23:59 et 00:01 sont deux jours différents en heure locale", () => {
    expect(today(new Date(2026, 4, 3, 23, 59))).toBe("2026-05-03");
    expect(today(new Date(2026, 4, 4, 0, 1))).toBe("2026-05-04");
  });

  it("utilise le fuseau local et non UTC (toISOString décalerait de jour)", () => {
    const lateEvening = new Date(2026, 0, 1, 23, 30);
    expect(toLocalDate(lateEvening)).toBe("2026-01-01");
    const earlyMorning = new Date(2026, 0, 1, 0, 30);
    expect(toLocalDate(earlyMorning)).toBe("2026-01-01");
  });

  it("addDays traverse les changements d'heure sans glisser", () => {
    // Passage à l'heure d'été (dernier dimanche de mars) et à l'heure d'hiver (fin octobre) en Europe.
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-28", 2)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 2)).toBe("2026-10-26");
    expect(addDays("2026-01-31", 30)).toBe("2026-03-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("diffDays", () => {
    expect(diffDays("2026-03-28", "2026-03-30")).toBe(2);
    expect(diffDays("2026-12-31", "2027-01-01")).toBe(1);
    expect(diffDays("2026-01-10", "2026-01-01")).toBe(-9);
  });

  it("isValidLocalDate", () => {
    expect(isValidLocalDate("2026-02-28")).toBe(true);
    expect(isValidLocalDate("2026-02-30")).toBe(false);
    expect(isValidLocalDate("2026-2-3")).toBe(false);
    expect(isValidLocalDate(20260101)).toBe(false);
  });
});
