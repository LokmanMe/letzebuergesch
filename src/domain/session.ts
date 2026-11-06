import { introduce, review } from "./leitner";
import type { AppState, Card, CardProgress, LocalDate, Rating } from "./types";

function record(state: AppState, cardId: string, next: CardProgress, today: LocalDate): AppState {
  const isNew = state.progress[cardId] === undefined;
  const dayLog = state.log[today] ?? { reviewed: 0, newIntroduced: 0 };
  return {
    ...state,
    progress: { ...state.progress, [cardId]: next },
    log: {
      ...state.log,
      [today]: {
        reviewed: dayLog.reviewed + 1,
        newIntroduced: dayLog.newIntroduced + (isNew ? 1 : 0),
      },
    },
  };
}

/** Enregistre une notation (Raté / Difficile / Facile) dans l'état. Fonction pure. */
export function applyRating(state: AppState, cardId: string, rating: Rating, today: LocalDate): AppState {
  return record(state, cardId, review(state.progress[cardId], rating, today), today);
}

/** Enregistre la découverte d'une carte nouvelle (« C'est noté ») : boîte 1, à revoir demain. */
export function applyDiscovery(state: AppState, cardId: string, today: LocalDate): AppState {
  if (state.progress[cardId] !== undefined) return state;
  return record(state, cardId, introduce(today), today);
}

/**
 * Phase d'une carte dans la session :
 * - "discover" : carte jamais vue, la réponse est montrée directement ;
 * - "review" : rappel noté Raté / Difficile / Facile, qui décide de la prochaine échéance ;
 * - "practice" : nouvel essai en fin de session (après une découverte ou un Raté), sans effet sur le planning.
 */
export type SessionPhase = "discover" | "review" | "practice";

export type SessionItem = {
  card: Card;
  phase: SessionPhase;
  /** Pour une carte en "practice" : pourquoi elle revient. */
  practiceReason?: "discovered" | "missed";
};

export function startSession(cards: Card[], state: AppState): SessionItem[] {
  return cards.map((card) => ({ card, phase: state.progress[card.id] === undefined ? "discover" : "review" }));
}

/**
 * Retire la carte courante de la file. Une carte découverte, ou ratée en révision,
 * revient une seule fois en fin de file pour un essai d'entraînement.
 */
export function advanceSession(queue: SessionItem[], outcome: Rating | "noted"): SessionItem[] {
  const [current, ...rest] = queue;
  if (!current) return queue;
  if (current.phase === "discover") return [...rest, { card: current.card, phase: "practice", practiceReason: "discovered" }];
  if (current.phase === "review" && outcome === "again") {
    return [...rest, { card: current.card, phase: "practice", practiceReason: "missed" }];
  }
  return rest;
}
