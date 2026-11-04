import { review } from "./leitner";
import type { AppState, Card, LocalDate, Rating } from "./types";

/**
 * Enregistre une notation dans l'état (fonction pure).
 * `isRetry` : 2e présentation d'une carte ratée dans la même session — simple entraînement,
 * la boîte et l'échéance ne bougent plus.
 */
export function applyRating(
  state: AppState,
  cardId: string,
  rating: Rating,
  today: LocalDate,
  isRetry = false,
): AppState {
  if (isRetry) return state;
  const previous = state.progress[cardId];
  const dayLog = state.log[today] ?? { reviewed: 0, newIntroduced: 0 };
  return {
    ...state,
    progress: { ...state.progress, [cardId]: review(previous, rating, today) },
    log: {
      ...state.log,
      [today]: {
        reviewed: dayLog.reviewed + 1,
        newIntroduced: dayLog.newIntroduced + (previous === undefined ? 1 : 0),
      },
    },
  };
}

/** Élément de la file de session. Une carte ratée est remise en fin de file (une seule fois). */
export type SessionItem = { card: Card; isRetry: boolean };

export function startSession(cards: Card[]): SessionItem[] {
  return cards.map((card) => ({ card, isRetry: false }));
}

/** Retire la carte courante ; si elle est ratée (1re fois), la remet à la fin en mode entraînement. */
export function advanceSession(queue: SessionItem[], rating: Rating): SessionItem[] {
  const [current, ...rest] = queue;
  if (!current) return queue;
  if (rating === "again" && !current.isRetry) return [...rest, { card: current.card, isRetry: true }];
  return rest;
}
