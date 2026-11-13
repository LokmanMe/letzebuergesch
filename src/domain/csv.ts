import type { Card, Lesson, Module } from "./types";

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
export function cardsToCsv(cards: Card[], modules: Module[], lessons: Lesson[] = []): string {
  const titles = new Map(modules.map((m) => [m.id, m.title]));
  const rows = cards.map((c) =>
    [c.id, titles.get(c.moduleId) ?? c.moduleId, c.fr, c.lb, c.phonetic, c.note ?? "", c.verified ? "oui" : "non", "", ""]
      .map(cell)
      .join(";"),
  );
  // Grammaire : tableaux et exemples (le luxembourgeois à faire relire), la règle en note.
  for (const l of lessons) {
    const lines = [...(l.table?.rows ?? []).map(([lb, fr]) => ({ lb, fr })), ...l.examples.filter((e) => !e.cardId)];
    lines.forEach((e, i) =>
      rows.push(
        [`${l.id}-${i + 1}`, `Grammaire : ${l.title}`, e.fr, e.lb, "", i === 0 ? l.points.join(" ").replace(/\*\*/g, "") : "", l.verified ? "oui" : "non", "", ""]
          .map(cell)
          .join(";"),
      ),
    );
  }
  return "﻿" + [HEADERS.join(";"), ...rows].join("\r\n") + "\r\n";
}
