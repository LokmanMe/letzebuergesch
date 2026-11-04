import type { AppState, Card, LocalDate } from "./types";

/** Hachage simple et stable d'une chaîne (pour un choix déterministe par date). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Choisit la phrase du jour : parmi les cartes déjà vues (sinon le premier module),
 * en évitant celles déjà marquées « Fait ». Déterministe pour une date donnée.
 */
export function pickPhraseOfDay(cards: Card[], state: AppState, today: LocalDate): Card | undefined {
  const existing = state.phraseOfDay[today];
  if (existing) {
    const card = cards.find((c) => c.id === existing.cardId);
    if (card) return card;
  }

  const done = new Set(
    Object.values(state.phraseOfDay)
      .filter((e) => e.done)
      .map((e) => e.cardId),
  );
  const seen = cards.filter((c) => state.progress[c.id] !== undefined);
  const base = seen.length > 0 ? seen : cards.filter((c) => c.moduleId === cards[0]?.moduleId);
  const fresh = base.filter((c) => !done.has(c.id));
  const pool = fresh.length > 0 ? fresh : base;
  if (pool.length === 0) return undefined;
  return pool[hash(today) % pool.length];
}

export function setPhraseOfDayDone(state: AppState, today: LocalDate, cardId: string, done: boolean): AppState {
  return { ...state, phraseOfDay: { ...state.phraseOfDay, [today]: { cardId, done } } };
}

/** Historique des phrases du jour réalisées, de la plus récente à la plus ancienne. */
export function phraseHistory(state: AppState): { date: LocalDate; cardId: string }[] {
  return Object.entries(state.phraseOfDay)
    .filter(([, e]) => e.done)
    .map(([date, e]) => ({ date, cardId: e.cardId }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
