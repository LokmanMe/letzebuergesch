import { addDays } from "./dates";
import type { Box, CardProgress, LocalDate, Rating } from "./types";

/** Intervalle (en jours) avant la prochaine révision, par boîte. */
export const BOX_INTERVALS: Record<Box, number> = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };

/**
 * Applique une notation à une carte. Fonction pure : la date du jour est injectée.
 * - Carte neuve (progress undefined) : entre en boîte 1, puis la notation s'applique.
 * - Raté : retour en boîte 1, à revoir le lendemain.
 * - Difficile : reste dans sa boîte, échéance = intervalle de la boîte.
 * - Facile : monte d'une boîte (max 5), échéance = intervalle de la nouvelle boîte.
 */
export function review(progress: CardProgress | undefined, rating: Rating, today: LocalDate): CardProgress {
  const isNew = progress === undefined;
  const current: Box = progress?.box ?? 1;

  let box: Box;
  if (rating === "again") box = 1;
  else if (rating === "hard") box = current;
  else box = Math.min(current + 1, 5) as Box;

  return {
    box,
    due: addDays(today, BOX_INTERVALS[box]),
    firstSeen: progress?.firstSeen ?? today,
    lastReviewed: today,
    reviews: (progress?.reviews ?? 0) + 1,
    lapses: (progress?.lapses ?? 0) + (rating === "again" && !isNew ? 1 : 0),
  };
}

/** Première rencontre avec une carte (mode découverte) : boîte 1, à revoir le lendemain. */
export function introduce(today: LocalDate): CardProgress {
  return { box: 1, due: addDays(today, BOX_INTERVALS[1]), firstSeen: today, lastReviewed: today, reviews: 1, lapses: 0 };
}

export function isDue(progress: CardProgress, today: LocalDate): boolean {
  return progress.due <= today;
}
