import { isDue } from "./leitner";
import type { AppState, Card, LocalDate } from "./types";

export const FLASH_LIMIT = 10;

/** Cartes à réviser aujourd'hui (échéance atteinte ou dépassée), les plus en retard d'abord, puis boîte basse d'abord. */
export function dueCards(cards: Card[], state: AppState, today: LocalDate): Card[] {
  return cards
    .filter((c) => {
      const p = state.progress[c.id];
      return p !== undefined && isDue(p, today);
    })
    .sort((a, b) => {
      const pa = state.progress[a.id];
      const pb = state.progress[b.id];
      if (pa.due !== pb.due) return pa.due < pb.due ? -1 : 1;
      return pa.box - pb.box;
    });
}

/** Cartes jamais vues, dans l'ordre du contenu. */
export function unseenCards(cards: Card[], state: AppState): Card[] {
  return cards.filter((c) => state.progress[c.id] === undefined);
}

/** Nombre de nouvelles cartes encore autorisées aujourd'hui. */
export function newCardsRemaining(state: AppState, today: LocalDate): number {
  const introduced = state.log[today]?.newIntroduced ?? 0;
  return Math.max(0, state.settings.newPerDay - introduced);
}

/** Nouvelles cartes proposables aujourd'hui (dans la limite quotidienne). */
export function availableNewCards(cards: Card[], state: AppState, today: LocalDate): Card[] {
  return unseenCards(cards, state).slice(0, newCardsRemaining(state, today));
}

/** Session du jour : révisions dues d'abord, puis nouvelles cartes jusqu'à la limite. */
export function buildDailyQueue(cards: Card[], state: AppState, today: LocalDate): Card[] {
  return [...dueCards(cards, state, today), ...availableNewCards(cards, state, today)];
}

/** Révision éclair : au plus 10 cartes dues, pas de nouvelles. */
export function buildFlashQueue(cards: Card[], state: AppState, today: LocalDate): Card[] {
  return dueCards(cards, state, today).slice(0, FLASH_LIMIT);
}

/** Taille minimale d'un entraînement libre. */
export const PRACTICE_MIN = 5;

/**
 * Entraînement libre (pour compléter l'objectif du jour) : cartes déjà vues,
 * les plus fragiles d'abord, puis les moins récemment revues. Sans effet sur le planning.
 */
export function buildPracticeQueue(cards: Card[], state: AppState, size: number): Card[] {
  return cards
    .filter((c) => state.progress[c.id] !== undefined)
    .sort((a, b) => {
      const pa = state.progress[a.id];
      const pb = state.progress[b.id];
      if (pa.box !== pb.box) return pa.box - pb.box;
      return pa.lastReviewed < pb.lastReviewed ? -1 : pa.lastReviewed > pb.lastReviewed ? 1 : 0;
    })
    .slice(0, Math.max(PRACTICE_MIN, size));
}

/** Taille d'un entraînement libre quand l'objectif du jour est déjà atteint. */
export const PRACTICE_DEFAULT = 10;

/**
 * Nouvelles phrases en plus : une fois la session du jour finie, on peut découvrir
 * le lot suivant sans attendre demain (au-delà de la limite quotidienne).
 * Les révisions dues passent d'abord, pour ne jamais les laisser de côté.
 */
export function buildBonusQueue(cards: Card[], state: AppState, today: LocalDate, size: number): Card[] {
  return [...dueCards(cards, state, today), ...unseenCards(cards, state).slice(0, Math.max(1, size))];
}
