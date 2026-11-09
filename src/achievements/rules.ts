import { solidCards, streak } from "../domain/stats";
import type { AppState, Card, LocalDate } from "../domain/types";

/** Badges (V2, non affichés en V1) : règles pures, fonction de l'état → badges débloqués. */
export type AchievementContext = { state: AppState; cards: Card[]; today: LocalDate };

export type Achievement = {
  id: string;
  title: string;
  description: string;
  unlocked: (ctx: AchievementContext) => boolean;
};

const totalReviews = (s: AppState) => Object.values(s.log).reduce((n, d) => n + d.reviewed, 0);
const phrasesDone = (s: AppState) => Object.values(s.phraseOfDay).filter((e) => e.done).length;

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-review", title: "Premier pas", description: "Réviser une première carte", unlocked: ({ state }) => totalReviews(state) >= 1 },
  { id: "streak-7", title: "Une semaine", description: "Série de 7 jours", unlocked: ({ state, today }) => streak(state, today) >= 7 },
  { id: "streak-30", title: "Un mois", description: "Série de 30 jours", unlocked: ({ state, today }) => streak(state, today) >= 30 },
  { id: "solid-25", title: "25 solides", description: "25 phrases solides (4 points de maîtrise ou plus)", unlocked: ({ state, cards }) => solidCards(cards, state).length >= 25 },
  { id: "phrase-5", title: "Sur le terrain", description: "Placer 5 phrases du jour", unlocked: ({ state }) => phrasesDone(state) >= 5 },
];

export function unlockedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.unlocked(ctx));
}
