import { describe, expect, it } from "vitest";
import { cardsToCsv } from "./csv";
import type { Card } from "./types";

describe("export CSV de relecture", () => {
  it("en-tête, BOM, échappement des ; et des guillemets", () => {
    const card: Card = {
      id: "m-001",
      moduleId: "m",
      type: "phrase",
      fr: 'Dire "bonjour"; poliment',
      lb: "Moien!",
      phonetic: "moï-eune",
      verified: false,
    };
    const csv = cardsToCsv([card], [{ id: "m", title: "Salutations", description: "", cards: [card] }]);
    expect(csv.startsWith("﻿id;module;francais;luxembourgeois")).toBe(true);
    const line = csv.split("\r\n")[1];
    expect(line).toBe('m-001;Salutations;"Dire ""bonjour""; poliment";Moien!;moï-eune;;non;;');
  });
});
