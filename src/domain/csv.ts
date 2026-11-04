import type { Card, Module } from "./types";

const HEADERS = ["id", "module", "francais", "luxembourgeois", "phonetique", "note", "verifie", "correction", "commentaire"];

/** Échappe une cellule CSV (séparateur « ; », compatible Excel en français). */
function cell(v: string): string {
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Export CSV pour la relecture par un locuteur natif.
 * Les colonnes « correction » et « commentaire » sont laissées vides pour le relecteur.
 * Préfixé d'un BOM UTF-8 pour qu'Excel affiche correctement ë, é, ä…
 */
export function cardsToCsv(cards: Card[], modules: Module[]): string {
  const titles = new Map(modules.map((m) => [m.id, m.title]));
  const rows = cards.map((c) =>
    [c.id, titles.get(c.moduleId) ?? c.moduleId, c.fr, c.lb, c.phonetic, c.note ?? "", c.verified ? "oui" : "non", "", ""]
      .map(cell)
      .join(";"),
  );
  return "﻿" + [HEADERS.join(";"), ...rows].join("\r\n") + "\r\n";
}
