import type { Card, Module } from "./types";

/** Toutes les cartes : contenu officiel puis cartes personnelles (un id perso ne remplace jamais un id officiel). */
export function mergeCards(modules: Module[], customCards: Card[]): Card[] {
  const official = modules.flatMap((m) => m.cards);
  const ids = new Set(official.map((c) => c.id));
  return [...official, ...customCards.filter((c) => !ids.has(c.id))];
}

/** URL de recherche lod.lu. Aucun lien audio direct n'est jamais construit. */
export function lodSearchUrl(card: Pick<Card, "lb" | "lodQuery">): string {
  return `https://lod.lu/?q=${encodeURIComponent(card.lodQuery ?? card.lb)}`;
}
